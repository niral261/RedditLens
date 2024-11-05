const { Kafka } = require("kafkajs");
const axios = require("axios");
const dotenv = require("dotenv");
const { accessToken, getAccessToken } = require('./server.js');
const { client } = require('/Users/Nishi Ajmera/Downloads/social media analytics/social_media_analytics_backend/redis.js');

dotenv.config();

const kafka = new Kafka({
    clientId: "reddit-client",
    brokers: [process.env.KAFKA_BROKER]
});
const producer = kafka.producer();
(async() => {
    await producer.connect();
})();

// Function to fetch Reddit posts based on a subreddit and search query
async function fetchRedditPosts(subreddit, query, accessToken) {
    const cacheKey = `${subreddit}:${query}`;
    console.time('Cache Access Time');
    const cachedData = await client.get(cacheKey);
    if(cachedData){
        console.timeEnd('Cache Access Time');
        console.log('Serving from cache from fetchRedditPosts');
        return JSON.parse(cachedData);
    }

    console.time('Reddit API Fetch Time');
    try {
        const { data } = await axios.get(`https://oauth.reddit.com/r/${subreddit}/search?q=${query}&restrict_sr=on`, {  /*https://oauth.reddit.com/r/${subreddit}/search?q=${query}}&restrict_sr=on */
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': process.env.REDDIT_USER_AGENT 
            },
            params: {
                q: query,
                sort: "new",
                limit: 10,
                restrict_sr: true,
            }
        });

        const posts = data.data.children.map(post => post.data);

        // Store the data in Redis cache
        await client.set(cacheKey, JSON.stringify(posts), 'EX', 3600);  // Cache for 1 hour

        console.timeEnd('Reddit API Fetch Time');
        console.log("Fetched from Reddit API");
        return posts; 
    } catch (error) {
        console.error("Error fetching Reddit posts:", error.response ? error.response.data : error.message);
        return [];
    }
}

// Function to send Reddit posts to Kafka
async function produceRedditPosts(subreddit, query) {
    let token = accessToken; 
    if (!token) {
        token = await getAccessToken();
    }

    try {
        const posts = await fetchRedditPosts(subreddit, query, token);
        if (!posts.length) {
            console.log("No posts fetched. Check if the subreddit and query are correct.");
        } else {
            for (const post of posts) {
                await producer.send({
                    topic: 'reddit_posts',
                    messages: [{ value: JSON.stringify(post) }],
                });
            }
            console.log(`Successfully produced ${posts.length} Reddit posts to Kafka topic`);
        }
    } catch (error) {
        console.error("Error producing Reddit posts:", error);
    } finally {
        await producer.disconnect();
    }
}

produceRedditPosts('chatgpt', 'ai').catch(console.error);
