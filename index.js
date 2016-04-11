import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLID
} from 'graphql';

const ResultType = new GraphQLObjectType({
  name : 'Result',
  fields : {
    text : {
      type : new GraphQLNonNull(GraphQLString)
    },
    id : {
      type : new GraphQLNonNull(GraphQLID)
    }
  }
})

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      search: {
        type: ResultType,
        args:  {
          text: {
            type : new GraphQLNonNull(GraphQLString)
          }
        },
        resolve(root, args) {
          const text = args.text;
          return { text, id: `id:${text}` };
        }
      }
    }
  })
});

const query = `
  {
    search(text: "cat") {
      text
      id @include(if: false)
    }
  }
`;

graphql(schema, query).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
