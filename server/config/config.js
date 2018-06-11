var env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  process.env.PORT = 5000;
  process.env.MONGODB_URI = 'mongodb://localhost:27017/MyTodoApp';
} else if (env === 'test') {
  process.env.PORT = 5000;
  process.env.MONGODB_URI = 'mongodb://test-url:27017/MyTodoAppTest';
}
