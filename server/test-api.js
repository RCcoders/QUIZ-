import fetch from 'node-fetch';

async function testApi() {
    const baseUrl = 'http://localhost:5000/api';

    try {
        // 1. Test Registration
        console.log('Testing Registration...');
        const registerRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
                password: 'password123',
                displayName: 'Test Teacher',
                role: 'teacher'
            })
        });
        const registerData = await registerRes.json();
        console.log('Registration Response:', registerData);

        if (!registerRes.ok) throw new Error('Registration failed');

        const token = registerData.token;
        const teacherId = registerData._id;

        // 2. Test Quiz Creation
        console.log('\nTesting Quiz Creation...');
        const quizRes = await fetch(`${baseUrl}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                teacherId,
                title: 'Sample Science Quiz',
                description: 'Testing the API',
                subject: 'Science',
                questions: [
                    {
                        questionText: 'What is the powerhouse of the cell?',
                        optionA: 'Nucleus',
                        optionB: 'Mitochondria',
                        optionC: 'Ribosome',
                        optionD: 'Chloroplast',
                        correctAnswer: 'B',
                        difficulty: 'easy'
                    }
                ]
            })
        });
        const quizData = await quizRes.json();
        console.log('Quiz Creation Response:', quizData);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testApi();
