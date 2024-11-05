const redis = require('redis')

const client = redis.createClient({
    host: '127.0.0.1', // Redis server host
    port: 6379,        // Redis server port
});

client.on('connect', () => {
    console.log('Connected to Redis server');
});

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

module.exports = {
    client
};