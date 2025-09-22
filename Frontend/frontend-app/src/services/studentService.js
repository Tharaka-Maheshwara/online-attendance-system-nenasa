// Student service for API calls
const API_BASE_URL = 'http://localhost:8000';

// Create a new student
export const createStudent = async (studentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create student');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating student:', error);
        throw error;
    }
};

// Get all students
export const getAllStudents = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
};

// Get student by ID
export const getStudentById = async (studentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching student:', error);
        throw error;
    }
};

// Update student
export const updateStudent = async (studentId, studentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update student');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating student:', error);
        throw error;
    }
};

// Delete student
export const deleteStudent = async (studentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete student');
        }

        return true;
    } catch (error) {
        console.error('Error deleting student:', error);
        throw error;
    }
};

// Lookup student by registration number
export const lookupStudentByRegisterNumber = async (registerNumber) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/lookup/${registerNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Student not found
            }
            throw new Error('Failed to lookup student');
        }

        return await response.json();
    } catch (error) {
        console.error('Error looking up student:', error);
        throw error;
    }
};