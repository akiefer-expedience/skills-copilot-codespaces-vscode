// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { randomBytes } = require('crypto');
const app = express();

app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// post request to create comment
app.post('/posts/:id/comments', async (req, res) => {
  // generate random id
  const commentId = randomBytes(4).toString('hex');
  // get the comment from request body
  const { content } = req.body;
  // get the post id from request params
  const postId = req.params.id;
  // get the comments from the post id
  const comments = commentsByPostId[postId] || [];
  // push the comment to the array
  comments.push({ id: commentId, content, status: 'pending' });
  // save the comment
  commentsByPostId[postId] = comments;
  // emit event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId, status: 'pending' },
  });
  // send response
  res.status(201).send(comments);
});

// event handler for event bus
app.post('/events', async (req, res) => {
  console.log('Received Event', req.body.type);
  // get the event type and data
  const { type, data } = req.body;
  // if comment is moderated
  if (type === 'CommentModerated') {
    // get the post id
    const { postId, id, status, content } = data;
    // get the comments from the post id
    const comments = commentsByPostId[postId];
    // find the comment
    const comment = comments.find((comment) => {
      return comment.id === id;
    });
    // update the comment status
    comment.status = status;
    // emit event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: { id, status

