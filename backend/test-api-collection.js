#!/usr/bin/env node

/**
 * Portal Berita API Collection Test Script
 * 
 * This script helps test the API collection by running a series of
 * requests to verify the API is working correctly.
 * 
 * Usage: node test-api-collection.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_CONFIG = {
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Test credentials
const TEST_USERS = {
    admin: {
        email: 'admin@portalberita.com',
        password: 'Admin123!'
    },
    jurnalis: {
        email: 'jurnalis@portalberita.com',
        password: 'Editor123!'
    },
    instansi: {
        email: 'instansi@portalberita.com',
        password: 'Admin123!'
    },
    pengguna: {
        email: 'pengguna@portalberita.com',
        password: 'User123!'
    }
};

// Global variables for test data
let tokens = {};
let testData = {};

/**
 * Utility function to make HTTP requests
 */
async function makeRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            ...TEST_CONFIG
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || 500,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Test authentication endpoints
 */
async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    // Test login for each role
    for (const [role, credentials] of Object.entries(TEST_USERS)) {
        console.log(`  Testing ${role} login...`);
        
        const result = await makeRequest('POST', '/api/auth/login', credentials);
        
        if (result.success && result.data.data?.tokens?.accessToken) {
            tokens[role] = result.data.data.tokens.accessToken;
            console.log(`  ✅ ${role} login successful`);
        } else {
            console.log(`  ❌ ${role} login failed:`, result.error?.message || 'Unknown error');
        }
    }

    // Test profile endpoint
    if (tokens.admin) {
        console.log('  Testing get profile...');
        const result = await makeRequest('GET', '/api/auth/profile', null, tokens.admin);
        
        if (result.success) {
            console.log('  ✅ Get profile successful');
        } else {
            console.log('  ❌ Get profile failed:', result.error?.message);
        }
    }
}

/**
 * Test categories endpoints
 */
async function testCategories() {
    console.log('\n📂 Testing Categories...');

    // Get all categories
    console.log('  Testing get all categories...');
    const categoriesResult = await makeRequest('GET', '/api/kategori');
    
    if (categoriesResult.success) {
        console.log('  ✅ Get categories successful');
        if (categoriesResult.data.data?.categories?.length > 0) {
            testData.kategoriId = categoriesResult.data.data.categories[0].id;
        }
    } else {
        console.log('  ❌ Get categories failed:', categoriesResult.error?.message);
    }

    // Test create category (admin only)
    if (tokens.admin) {
        console.log('  Testing create category (admin)...');
        const createResult = await makeRequest('POST', '/api/kategori', {
            nama: 'Test Category',
            deskripsi: 'Test category description',
            slug: 'test-category-' + Date.now(),
            isActive: true
        }, tokens.admin);

        if (createResult.success) {
            console.log('  ✅ Create category successful');
            testData.createdKategoriId = createResult.data.data?.category?.id;
        } else {
            console.log('  ❌ Create category failed:', createResult.error?.message);
        }
    }
}

/**
 * Test news articles endpoints
 */
async function testNewsArticles() {
    console.log('\n📰 Testing News Articles...');

    // Get all news
    console.log('  Testing get all news...');
    const newsResult = await makeRequest('GET', '/api/berita?status=published&limit=5');
    
    if (newsResult.success) {
        console.log('  ✅ Get news successful');
        if (newsResult.data.data?.articles?.length > 0) {
            testData.beritaId = newsResult.data.data.articles[0].id;
        }
    } else {
        console.log('  ❌ Get news failed:', newsResult.error?.message);
    }

    // Test create news article (jurnalis)
    if (tokens.jurnalis && testData.kategoriId) {
        console.log('  Testing create news article (jurnalis)...');
        const createResult = await makeRequest('POST', '/api/berita', {
            judul: 'Test News Article',
            slug: 'test-news-article-' + Date.now(),
            konten: 'This is a test news article content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            ringkasan: 'Test news article summary',
            kategoriId: testData.kategoriId,
            tags: ['test', 'news'],
            status: 'published'
        }, tokens.jurnalis);

        if (createResult.success) {
            console.log('  ✅ Create news article successful');
            testData.createdBeritaId = createResult.data.data?.article?.id;
        } else {
            console.log('  ❌ Create news article failed:', createResult.error?.message);
        }
    }
}

/**
 * Test comments endpoints
 */
async function testComments() {
    console.log('\n💬 Testing Comments...');

    if (!testData.beritaId) {
        console.log('  ⚠️  Skipping comments test - no news article available');
        return;
    }

    // Get comments for news
    console.log('  Testing get comments for news...');
    const commentsResult = await makeRequest('GET', `/api/berita/${testData.beritaId}/komentar`);
    
    if (commentsResult.success) {
        console.log('  ✅ Get comments successful');
    } else {
        console.log('  ❌ Get comments failed:', commentsResult.error?.message);
    }

    // Test add comment
    if (tokens.pengguna) {
        console.log('  Testing add comment...');
        const addResult = await makeRequest('POST', `/api/berita/${testData.beritaId}/komentar`, {
            konten: 'This is a test comment from the API collection test script.'
        }, tokens.pengguna);

        if (addResult.success) {
            console.log('  ✅ Add comment successful');
            testData.komentarId = addResult.data.data?.comment?.id;
        } else {
            console.log('  ❌ Add comment failed:', addResult.error?.message);
        }
    }
}

/**
 * Test bookmarks endpoints
 */
async function testBookmarks() {
    console.log('\n🔖 Testing Bookmarks...');

    if (!testData.beritaId || !tokens.pengguna) {
        console.log('  ⚠️  Skipping bookmarks test - missing requirements');
        return;
    }

    // Test add bookmark
    console.log('  Testing add bookmark...');
    const addResult = await makeRequest('POST', '/api/bookmarks', {
        beritaId: testData.beritaId
    }, tokens.pengguna);

    if (addResult.success) {
        console.log('  ✅ Add bookmark successful');
        testData.bookmarkId = addResult.data.data?.bookmark?.id;
    } else {
        console.log('  ❌ Add bookmark failed:', addResult.error?.message);
    }

    // Test get bookmarks
    console.log('  Testing get bookmarks...');
    const getResult = await makeRequest('GET', '/api/bookmarks', null, tokens.pengguna);

    if (getResult.success) {
        console.log('  ✅ Get bookmarks successful');
    } else {
        console.log('  ❌ Get bookmarks failed:', getResult.error?.message);
    }

    // Test check bookmark status
    console.log('  Testing check bookmark status...');
    const checkResult = await makeRequest('GET', `/api/bookmarks/check/${testData.beritaId}`, null, tokens.pengguna);

    if (checkResult.success) {
        console.log('  ✅ Check bookmark status successful');
    } else {
        console.log('  ❌ Check bookmark status failed:', checkResult.error?.message);
    }
}

/**
 * Test role-based access control
 */
async function testRoleBasedAccess() {
    console.log('\n🛡️  Testing Role-Based Access Control...');

    // Test admin-only endpoint with non-admin token
    if (tokens.pengguna) {
        console.log('  Testing admin endpoint with pengguna token (should fail)...');
        const result = await makeRequest('GET', '/api/users/stats', null, tokens.pengguna);
        
        if (result.status === 403) {
            console.log('  ✅ Access control working - pengguna correctly denied');
        } else {
            console.log('  ❌ Access control failed - pengguna should be denied');
        }
    }

    // Test admin endpoint with admin token
    if (tokens.admin) {
        console.log('  Testing admin endpoint with admin token (should succeed)...');
        const result = await makeRequest('GET', '/api/users/stats', null, tokens.admin);
        
        if (result.success) {
            console.log('  ✅ Admin access working correctly');
        } else {
            console.log('  ❌ Admin access failed:', result.error?.message);
        }
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting Portal Berita API Collection Tests...');
    console.log(`📍 Base URL: ${BASE_URL}`);

    try {
        await testAuthentication();
        await testCategories();
        await testNewsArticles();
        await testComments();
        await testBookmarks();
        await testRoleBasedAccess();

        console.log('\n✅ API Collection Tests Completed!');
        console.log('\n📊 Test Summary:');
        console.log(`   Tokens obtained: ${Object.keys(tokens).length}/4`);
        console.log(`   Test data created: ${Object.keys(testData).length} items`);
        
        if (Object.keys(tokens).length === 4) {
            console.log('\n🎉 All authentication tests passed!');
            console.log('   Your Postman collection should work perfectly.');
        } else {
            console.log('\n⚠️  Some authentication tests failed.');
            console.log('   Check your database setup and default users.');
        }

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Check if axios is available
try {
    require.resolve('axios');
} catch (e) {
    console.error('❌ axios is required to run this test script.');
    console.error('   Install it with: npm install axios');
    process.exit(1);
}

// Run tests
runTests().catch(console.error);
