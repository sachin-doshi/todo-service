const express = require('express');
const express_graphql = require('express-graphql');
const { buildSchema } = require('graphql');
const MeType = require('./types');
const mgdb = require('./mgdb');

//destructure
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull
} = require('graphql')



// const RootQueryType = new GraphQLObjectType({

//     name: 'RootQueryType',
//     fields: {
//         hello:{
//             type:GraphQLString,
//             resolve: () => 'This my world...'
//         }
//     }




// });

const RootQueryType = new GraphQLObjectType({

    name: 'RootQueryType',
    fields: {
        me:{
            type: MeType,
            description: ' User Object ID',
            args: {
                key:{
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (obj,args,ctx) => {
                const {mPool} = ctx ;
                return mgdb(mPool).getUser(args.key);                
            }
        }
    }




});

// GraphQL schema
const ncschema = new GraphQLSchema({
    query: RootQueryType
    //mutation:...
});


module.exports = ncschema ;

