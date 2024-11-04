const mongoose = require('mongoose');

const redditPostSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    created_utc: {
        type: Date,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    num_comments: {
        type: Number,
        default: 0,
    },
    score: {
        type: Number,
        default: 0,
    },
    subreddit: {
        type: String,
        required: true,
    },
});

const RedditPost = mongoose.model('RedditPost', redditPostSchema);

module.exports = RedditPost;
