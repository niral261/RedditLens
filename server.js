const express = require("express");
const dotenv = require("dotenv");
const Reddit = require("./model/reddit.js");
const connectDB = require('/Users/Nishi Ajmera/Downloads/social media analytics/social_media_analytics_backend/database.js');
const axios = require("axios");
const { Client } = require('@elastic/elasticsearch');

dotenv.config();

const app = express();
app.use(express.json());

// Connect to the database
connectDB();

// Function to get access token for Reddit API
async function getAccessToken() {
  try {
    const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
      `grant_type=password&username=${process.env.REDDIT_USERNAME}&password=${process.env.REDDIT_PASSWORD}`, {
      auth: {
        username: process.env.REDDIT_CLIENT_ID,
        password: process.env.REDDIT_CLIENT_SECRET
      },
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.message);
    throw new Error('Unable to fetch access token');
  }
}

let accessToken = '';
// Define route to fetch Reddit posts
app.get('/reddit/:subreddit', async (req, res) => {
  const { subreddit } = req.params;
  console.log(subreddit);
  if (!accessToken) {
    accessToken = await getAccessToken();
  }
  try {
    const url = `https://oauth.reddit.com/r/Technology/search?q=AI&restrict_sr=on`; 
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT
      }
    });

    const posts = response.data.data.children.map(child => {
      const postData = child.data;
      return {
        id: postData.id,
        title: postData.title,
        author: postData.author,
        created_utc: new Date(postData.created_utc * 1000), // Convert to Date object
        url: postData.url,
        num_comments: postData.num_comments,
        score: postData.score,
        subreddit: postData.subreddit,
      };
    });

    // Save posts to MongoDB
    await Reddit.insertMany(posts);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts from Reddit:', error.message);
    res.status(500).json({ error: 'Failed to fetch posts from Reddit' });
  }
});

// Route to fetch all saved Reddit posts
app.get('/reddits', async (req, res) => {
  try {
    const reddits = await Reddit.find();
    res.status(200).json(reddits);
  } catch (error) {
    console.error('Error retrieving reddits:', error.message);
    res.status(500).json({ error: 'Failed to retrieve reddits' });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running successfully on PORT ${PORT}`);
});


const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'niral'
  }
});


async function testConnection() {
  try {
    await client.ping();
    console.log('Elasticsearch connection successful');
  } catch (error) {
    console.error('Elasticsearch connection failed:', error);
  }
}

testConnection();

module.exports = {
  accessToken,
  getAccessToken
};