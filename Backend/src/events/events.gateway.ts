import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  
  // Store user connections: { userId: socketId }
  private userConnections = new Map<string, string>();
  
  // Store student class enrollments: { studentEmail: [classIds] }
  private studentClasses = new Map<string, number[]>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove from userConnections
    for (const [userId, socketId] of this.userConnections.entries()) {
      if (socketId === client.id) {
        this.userConnections.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userEmail: string; role: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.userConnections.set(data.userEmail, client.id);
    this.logger.log(`User registered: ${data.userEmail} (${data.role})`);
    
    client.emit('registered', { 
      success: true, 
      message: 'Successfully connected to real-time updates' 
    });
  }

  @SubscribeMessage('registerStudentClasses')
  handleRegisterStudentClasses(
    @MessageBody() data: { studentEmail: string; classIds: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.studentClasses.set(data.studentEmail, data.classIds);
    this.logger.log(`Student classes registered: ${data.studentEmail} -> ${data.classIds.join(', ')}`);
    
    // Join rooms for each class
    data.classIds.forEach(classId => {
      client.join(`class-${classId}`);
      this.logger.log(`Student ${data.studentEmail} joined room: class-${classId}`);
    });
    
    // Log all rooms the client is in
    const rooms = Array.from(client.rooms);
    this.logger.log(`Client ${client.id} is now in rooms: ${rooms.join(', ')}`);
    
    client.emit('classesRegistered', { 
      success: true, 
      classIds: data.classIds,
      rooms: rooms,
    });
  }

  // Emit new lecture note to students of a specific class
  emitNewLectureNote(classId: number, lectureNote: any) {
    this.logger.log(`Emitting new lecture note to class ${classId}`);
    this.logger.log(`Lecture note data: ${JSON.stringify(lectureNote)}`);
    
    const payload = {
      type: 'lecture-note',
      data: lectureNote,
      message: `New lecture note added: ${lectureNote.title}`,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to(`class-${classId}`).emit('newLectureNote', payload);
    this.logger.log(`Event emitted to room: class-${classId}`);
  }

  // Emit new announcement to students of a specific class
  emitNewAnnouncement(classId: number, announcement: any) {
    this.logger.log(`Emitting new announcement to class ${classId}`);
    this.logger.log(`Announcement data: ${JSON.stringify(announcement)}`);
    
    const payload = {
      type: 'announcement',
      data: announcement,
      message: `New announcement: ${announcement.title}`,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to(`class-${classId}`).emit('newAnnouncement', payload);
    this.logger.log(`Event emitted to room: class-${classId}`);
  }

  // Emit to specific student
  emitToStudent(studentEmail: string, event: string, data: any) {
    const socketId = this.userConnections.get(studentEmail);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`Emitted ${event} to student ${studentEmail}`);
    }
  }

  // Emit to all students in multiple classes
  emitToMultipleClasses(classIds: number[], event: string, data: any) {
    classIds.forEach(classId => {
      this.server.to(`class-${classId}`).emit(event, data);
    });
    this.logger.log(`Emitted ${event} to classes: ${classIds.join(', ')}`);
  }

  // Debug method to test emit to a specific class
  testEmitToClass(classId: number) {
    this.logger.log(`TEST: Emitting test notification to class ${classId}`);
    const payload = {
      type: 'announcement',
      data: { 
        id: 999,
        title: 'Test Notification',
        message: 'This is a test notification',
        classId: classId,
      },
      message: 'Test notification - if you see this, Socket.IO is working!',
      timestamp: new Date().toISOString(),
    };
    this.server.to(`class-${classId}`).emit('newAnnouncement', payload);
    this.logger.log(`TEST: Event emitted to room: class-${classId}`);
  }
}
