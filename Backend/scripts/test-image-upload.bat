@echo off
echo 🧪 Testing Student Image Upload Feature...

echo.
echo 📝 Test 1: Creating student without image...
curl -X POST http://localhost:8000/student ^
  -F "name=Test Student 1" ^
  -F "email=test1@example.com" ^
  -F "registerNumber=TEST001" ^
  -F "contactNumber=0771234567" ^
  -F "parentName=Test Parent 1" ^
  -F "parentEmail=parent1@example.com" ^
  -F "sub_1=Mathematics"

echo.
echo ✅ Test 1 completed

echo.
echo 📋 Test 2: Fetching all students...
curl -X GET http://localhost:8000/student

echo.
echo ✅ Test 2 completed

echo.
echo 🖼️ Test 3: Testing upload directory...
dir uploads\student-images 2>nul || echo Upload directory not yet created (will be created on first upload)

echo.
echo 🎯 Test completed! 
echo.
echo 📋 Manual Testing Steps:
echo   1. Start backend server: npm start
echo   2. Start frontend server: npm start  
echo   3. Open http://localhost:3000
echo   4. Go to Student Management
echo   5. Click 'Add New Student'
echo   6. Fill in details and upload an image
echo   7. Submit the form
echo   8. Verify image appears in the student table
echo.
echo 📁 Image URLs will be: http://localhost:8000/uploads/student-images/filename.jpg

pause