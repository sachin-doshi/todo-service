module.exports = mPool => {
    return {
        getUser(key){
            const dbo = mPool.db("MyTodoApp");
            dbo.collection("users").findOne({}, function(err, result) {
                if (err) throw err;
                console.log(result.email);
                return result.email;
              });
                  
                
        }
    }
}