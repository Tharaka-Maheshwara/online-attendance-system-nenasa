import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Attendance } from './attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import { User } from '../user/user.entity';
import { Student } from '../student/student.entity';
import { Class } from '../class/class.entity';
import { Payment } from '../payment/payment.entity';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User, Student, Class, Payment]),
    NotificationModule,
    UserModule,
    PaymentModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, RolesGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
