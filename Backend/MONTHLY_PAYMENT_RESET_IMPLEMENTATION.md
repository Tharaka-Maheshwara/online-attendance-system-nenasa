# Monthly Payment Reset Implementation

## සිංහලෙන් විස්තරය

අලුත් මාසයක් ආපු විට payment status එක ස්වයංක්‍රීයව "pending" status එකට reset වෙන පරිදි implement කර ඇත.

### ක්‍රියාකරන ආකාරය:

1. **Teacher attendance marking කරනවා**: Teacher කෙනෙක් attendance marking කරන විට system එක ස්වයංක්‍රීයව check කරනවා current month එක සඳහා payment records තියෙනවාද කියලා.

2. **නව මාසයේ records create කරනවා**: Current month එකට payment records නැත්නම්, ස්වයංක්‍රීයව සෑම student කෙනෙක්ටම "pending" status එකෙන් නව payment record එකක් create කරනවා.

3. **පෙර මාසයේ records වෙනස් නොවේ**: පෙර මාසවල තිබෙන "paid" status එක වෙනස් නොවේ. ඒවා තිබෙනවා history සඳහා.

### Technical Implementation:

## Backend Changes

### 1. Payment Service (`payment.service.ts`)

#### New Method: `ensureCurrentMonthPayments(classId: number)`

```typescript
// Automatically creates pending payment records for current month
// - Gets all enrolled students for the class
// - Checks if payment record exists for current month
// - Creates new 'pending' payment if doesn't exist
// - Previous month's 'paid' status remains unchanged
```

**Logic:**
- Filters students by: `grade === class.grade` AND `subject in student subjects`
- Creates payment record with:
  - `month`: Current month (1-12)
  - `year`: Current year
  - `status`: 'pending'
  - `amount`: Class monthly fee

### 2. Payment Controller (`payment.controller.ts`)

Updated `getPaymentStatusForClass()` endpoint:
```typescript
@Get('class/:classId/status')
async getPaymentStatusForClass(@Param('classId') classId: string) {
  // Ensures current month records before fetching
  await this.paymentService.ensureCurrentMonthPayments(+classId);
  return this.paymentService.getPaymentStatusForClass(+classId);
}
```

### 3. Attendance Module (`attendance.module.ts`)

Added `PaymentModule` to imports to enable PaymentService injection.

### 4. Attendance Service (`attendance.service.ts`)

#### New Method: `ensureCurrentMonthPaymentsForClass(classId: number)`

Wrapper method that calls `paymentService.ensureCurrentMonthPayments()`.

### 5. Attendance Controller (`attendance.controller.ts`)

Updated POST endpoint to ensure payments before marking attendance:
```typescript
@Post()
async create(@Body() attendanceData: any): Promise<any> {
  // Ensure current month payment records exist
  if (attendanceData.classId) {
    await this.attendanceService.ensureCurrentMonthPaymentsForClass(
      attendanceData.classId,
    );
  }
  // ... rest of attendance marking logic
}
```

## How It Works - Flow Diagram

```
Teacher Marks Attendance
        ↓
Check if current month payment records exist
        ↓
    [No] → Create pending payment records for all enrolled students
        ↓
    [Yes] → Continue with attendance marking
        ↓
Save attendance record
```

## Example Scenario

### Scenario: September → October Transition

**September 2025:**
- Student A: Class Math → Payment Status: 'paid' (paid on Sept 15)
- Student B: Class Math → Payment Status: 'paid' (paid on Sept 20)

**October 1, 2025 - Teacher marks attendance:**

System automatically:
1. Checks for October 2025 payment records
2. Finds none exist
3. Creates new records:
   - Student A: Class Math → Payment Status: 'pending' (month: 10, year: 2025)
   - Student B: Class Math → Payment Status: 'pending' (month: 10, year: 2025)

**September records remain:**
- Student A: Class Math → Payment Status: 'paid' (month: 9, year: 2025) ✅ Unchanged
- Student B: Class Math → Payment Status: 'paid' (month: 9, year: 2025) ✅ Unchanged

## Database Structure

```sql
CREATE TABLE payment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  classId INT NOT NULL,
  amount DECIMAL(10,2),
  month INT NOT NULL,        -- 1-12
  year INT NOT NULL,         -- 2025, 2026, etc.
  status ENUM('pending', 'paid', 'overdue'),
  paidDate DATETIME,
  paidBy INT,
  notes TEXT,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## API Endpoints

### 1. Get Payment Status (Auto-creates if needed)
```http
GET /payment/class/:classId/status
```
Response: List of students with payment status for current month

### 2. Mark Attendance (Auto-creates if needed)
```http
POST /attendance
Body: { classId, studentId, date, status, ... }
```
Automatically ensures current month payments before saving

## Testing

Use the provided SQL script: `test-monthly-payment-reset.sql`

1. Create payment records for previous month (September)
2. Mark attendance in October
3. Verify new 'pending' records created for October
4. Verify September 'paid' records remain unchanged

## Benefits

✅ **Automatic Reset**: No manual intervention needed each month
✅ **History Preserved**: All previous month records remain intact
✅ **Payment Tracking**: Clear monthly payment status for each student
✅ **Teacher Friendly**: Works seamlessly during attendance marking
✅ **Data Integrity**: Separate records per month/year combination

## Important Notes

- Payment records are created **per student per class per month**
- Each month gets its own set of payment records
- Previous months' data is never modified
- System automatically handles month transitions
- Works with existing payment marking functionality
