#!/bin/bash

# Test script for Student Image Upload functionality
echo "🧪 Testing Student Image Upload Feature..."

# Test 1: Create student without image
echo ""
echo "📝 Test 1: Creating student without image..."
curl -X POST http://localhost:8000/student \
  -F "name=Test Student 1" \
  -F "email=test1@example.com" \
  -F "registerNumber=TEST001" \
  -F "contactNumber=0771234567" \
  -F "parentName=Test Parent 1" \
  -F "parentEmail=parent1@example.com" \
  -F "sub_1=Mathematics"

echo ""
echo "✅ Test 1 completed"

# Test 2: Get all students to verify creation
echo ""
echo "📋 Test 2: Fetching all students..."
curl -X GET http://localhost:8000/student

echo ""
echo "✅ Test 2 completed"

# Test 3: Test static file serving (this would need an actual image file)
echo ""
echo "🖼️ Test 3: Testing static file serving..."
echo "To test image uploads manually:"
echo "1. Open http://localhost:3000 (Frontend)"
echo "2. Go to Student Management"
echo "3. Click 'Add New Student'"
echo "4. Fill in details and upload an image"
echo "5. Submit the form"
echo "6. Verify image appears in the student table"

echo ""
echo "📁 Upload directory structure:"
ls -la Backend/uploads/student-images/ 2>/dev/null || echo "Upload directory not yet created (will be created on first upload)"

echo ""
echo "🎯 Test completed! Check the results above."
echo ""
echo "📋 Manual Testing Checklist:"
echo "  ✅ Student creation without image"
echo "  ⏳ Student creation with image (requires manual testing)"
echo "  ⏳ Image display in student table (requires manual testing)"
echo "  ⏳ Image file serving (requires manual testing)"
echo "  ⏳ File validation (size/type) (requires manual testing)"