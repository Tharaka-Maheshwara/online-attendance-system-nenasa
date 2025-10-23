const BASE_URL = 'http://localhost:8000/attendance/analysis';

/**
 * Test script for the new Attendance Analysis API endpoints
 * Make sure your backend server is running before executing these tests
 */

// Test data
const TEST_GRADE = 10;
const TEST_SUBJECT = 'Mathematics';

async function testEndpoints() {
  console.log('🧪 Testing Attendance Analysis API Endpoints...\n');

  try {
    // Test 1: Get available subjects for a grade
    console.log('1️⃣ Testing: Get subjects by grade');
    const subjectsResponse = await fetch(`${BASE_URL}/subjects/${TEST_GRADE}`);
    const subjects = await subjectsResponse.json();
    console.log('✅ Subjects:', subjects);
    console.log('');

    // Test 2: Get students by grade and subject
    console.log('2️⃣ Testing: Get students by grade and subject');
    const studentsResponse = await fetch(`${BASE_URL}/students/${TEST_GRADE}/${encodeURIComponent(TEST_SUBJECT)}`);
    const students = await studentsResponse.json();
    console.log('✅ Students count:', students.length);
    console.log('');

    // Test 3: Basic attendance analysis
    console.log('3️⃣ Testing: Basic attendance analysis');
    const analysisResponse = await fetch(`${BASE_URL}/attendance/${TEST_GRADE}/${encodeURIComponent(TEST_SUBJECT)}`);
    const analysis = await analysisResponse.json();
    console.log('✅ Analysis summary:', analysis.summary);
    console.log('');

    // Test 4: Time-range analysis (month)
    console.log('4️⃣ Testing: Monthly time-range analysis');
    const monthlyResponse = await fetch(`${BASE_URL}/time-range/${TEST_GRADE}/${encodeURIComponent(TEST_SUBJECT)}/month`);
    const monthly = await monthlyResponse.json();
    console.log('✅ Monthly analysis time range:', monthly.timeRange);
    console.log('');

    // Test 5: Payment status
    console.log('5️⃣ Testing: Payment status');
    const paymentResponse = await fetch(`${BASE_URL}/payments/${TEST_GRADE}/${encodeURIComponent(TEST_SUBJECT)}`);
    const payments = await paymentResponse.json();
    console.log('✅ Payment statuses count:', payments.length);
    console.log('');

    // Test 6: Comprehensive analysis
    console.log('6️⃣ Testing: Comprehensive analysis');
    const comprehensiveResponse = await fetch(`${BASE_URL}/comprehensive/${TEST_GRADE}/${encodeURIComponent(TEST_SUBJECT)}`);
    const comprehensive = await comprehensiveResponse.json();
    console.log('✅ Comprehensive analysis with payment summary:', !!comprehensive.paymentSummary);
    console.log('');

    // Test 7: Chart data
    console.log('7️⃣ Testing: Chart data');
    const chartResponse = await fetch(`${BASE_URL}/chart-data/${TEST_GRADE}/${encodeURIComponent(TEST_SUBJECT)}?timeRange=week`);
    const chartData = await chartResponse.json();
    console.log('✅ Chart data points:', chartData.chartData.length);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure your backend server is running on port 3000');
    console.log('- Check if the database has attendance and student data');
    console.log('- Verify authentication tokens if required');
  }
}

// Execute tests
testEndpoints();

// Example chart data processing
function processChartData(chartData) {
  return {
    labels: chartData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric'
      });
    }),
    datasets: [
      {
        label: 'Present',
        data: chartData.map(item => item.present),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      },
      {
        label: 'Absent',
        data: chartData.map(item => item.absent),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2
      },
      {
        label: 'Late',
        data: chartData.map(item => item.late),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2
      }
    ]
  };
}

console.log('\n📊 Example Chart.js configuration:');
console.log(`
const chartConfig = {
  type: 'bar',
  data: processChartData(chartData.chartData),
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Student Attendance Analysis'
      },
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  }
};
`);