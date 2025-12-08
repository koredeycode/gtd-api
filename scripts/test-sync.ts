
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3000';

async function testSync() {
  try {
    // 1. Authenticate
    console.log('Authenticating...');
    const email = `test.${uuidv4()}@example.com`;
    let token = '';
    
    try {
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            email,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        });
        token = regRes.data.access_token;
        console.log('Created test user:', email);
    } catch (e) {
        // Fallback or error
        console.error('Registration failed:', e.message);
        return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Fetch categories to get a valid ID
    console.log('Fetching categories...');
    const catRes = await axios.get(`${BASE_URL}/categories`, { headers });
    const categories = catRes.data;
    if (!categories || categories.length === 0) {
        console.error('No categories found. Cannot create habit.');
        return;
    }
    const categoryId = categories[0].id;
    console.log('Using category:', categoryId);

    // 3. Test Push
    console.log('Testing Push...');
    const habitId = uuidv4();
    const pushPayload = {
      changes: {
        habits: {
          created: [{
            id: habitId,
            user_id: uuidv4(), 
            category_id: categoryId,
            title: 'Test Habit ' + habitId.substring(0, 8),
            type: 'BOOLEAN',
            frequency_json: { type: 'daily' },
            target_value: 0
          }],
          updated: [],
          deleted: []
        },
        logs: { created: [], updated: [], deleted: [] }
      }
    };

    const pushRes = await axios.post(`${BASE_URL}/api/v1/sync/push`, pushPayload, { headers });
    console.log('Push Response:', JSON.stringify(pushRes.data, null, 2));

    if (pushRes.data.changes.habits.created[0].id === habitId) {
        console.log('SUCCESS: Push returned created habit.');
    } else {
        console.error('FAILURE: Push did not echo habit correctly.');
    }

    // 4. Test Pull
    console.log('Testing Pull...');
    // Wait a bit to ensure timestamps differ if needed, though usually fine.
    const lastPulledAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const pullRes = await axios.post(`${BASE_URL}/api/v1/sync/pull`, { 
        last_pulled_at: lastPulledAt 
    }, { headers });
    
    console.log('Pull Response:', JSON.stringify(pullRes.data, null, 2));

    const pulledHabit = pullRes.data.changes.habits.updated.find((h: any) => h.id === habitId);
    if (pulledHabit) {
        console.log('SUCCESS: Pull returned the pushed habit.');
    } else {
        console.error('FAILURE: Pull did not return the pushed habit.');
    }

  } catch (error: any) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testSync();
