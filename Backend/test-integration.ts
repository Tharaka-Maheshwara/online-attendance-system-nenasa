import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AttendanceService } from './src/attendance/attendance.service';
import { NotificationService } from './src/notification/notification.service';
import { AttendanceStatus } from './src/attendance/attendance.entity';

async function testAttendanceEmailIntegration() {
  console.log('🔧 Testing Attendance Email Integration...\n');

  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const attendanceService = app.get(AttendanceService);
    const notificationService = app.get(NotificationService);

    console.log('✅ Application context created successfully!');

    // Test creating an attendance record with email notification
    const testAttendance = {
      studentId: 17, // From the database screenshot showing Nenasala User 1
      classId: 1,
      date: new Date().toISOString().split('T')[0],
      status: 'present' as AttendanceStatus,
      timestamp: new Date(),
      isPresent: true
    };

    console.log('📝 Creating attendance record:', testAttendance);

    // This should trigger the email notification
    const createdAttendance = await attendanceService.create(testAttendance);
    console.log('✅ Attendance created:', createdAttendance.id);

    console.log('📧 Email notification should have been sent automatically!');

    // Test for absent status as well
    const testAbsentAttendance = {
      studentId: 18, // From the database screenshot showing Nenasala User 2
      classId: 1,
      date: new Date().toISOString().split('T')[0],
      status: 'absent' as AttendanceStatus,
      timestamp: new Date(),
      isPresent: false
    };

    console.log('📝 Creating absent attendance record:', testAbsentAttendance);
    const createdAbsentAttendance = await attendanceService.create(testAbsentAttendance);
    console.log('✅ Absent attendance created:', createdAbsentAttendance.id);

    console.log('📧 Absent notification should have been sent automatically!');

    await app.close();
    console.log('\n🎯 Integration test completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('📝 Stack trace:', error.stack);
  }
}

testAttendanceEmailIntegration();