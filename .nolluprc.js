module.exports = {
    contentBase: 'public',
    port: 9001,
    hot: true,
    after: (app) => {
        require('./server-middleware')(app);    
    }
};