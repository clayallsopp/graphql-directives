import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLID,
  GraphQLBoolean
} from 'graphql';

import { DirectiveLocation, GraphQLDirective,
  GraphQLIncludeDirective, GraphQLSkipDirective } from 'graphql/type/directives';

const resolveWithInstrumentation = (resolve) => {
  return (source, args, context, info) => {
    const directives = info.fieldASTs[0].directives;
    const instrumentDirective = directives.filter(d => d.name.value === InstrumentDirective.name)[0];
    if (!instrumentDirective) {
      return resolve(source, args, context, info);
    }

    const start = new Date();
    return Promise.resolve(resolve(source, args, context, info)).then((result) => {
      const diff = (new Date() - start);
      const tag = instrumentDirective.arguments[0].value.value;
      console.log(`Instrumented ${tag} @ ${diff}ms`)
      return result;
    });
  };
};

const ResultType = new GraphQLObjectType({
  name : 'Result',
  fields : {
    text : {
      type : new GraphQLNonNull(GraphQLString)
    },
    id : {
      type : new GraphQLNonNull(GraphQLID),
      resolve: resolveWithInstrumentation((result) => {
        return result.id;
      })
    }
  }
});

const InstrumentDirective = new GraphQLDirective({
  name: 'instrument',
  description:
    'Instrument the time it takes to resolve the field',
  locations: [
    DirectiveLocation.FIELD,
  ],
  args: {
    tag: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A tag to store in the metrics store'
    }
  },
});


const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    search: {
      type: ResultType,
      args:  {
        text: { type : new GraphQLNonNull(GraphQLString) }
      },
      resolve(root, args) {
        const text = args.text;
        return { text, id: `id:${text}` };
      }
    }
  }
});


const schema = new GraphQLSchema({
  directives: [
    InstrumentDirective,
    GraphQLIncludeDirective,
    GraphQLSkipDirective
  ],
  query: RootQueryType
});

const query = `
  {
    search(text: "cat") {
      text
      id @instrument(tag: "search.id")
    }
  }
`;

graphql(schema, query).then(result => {
  console.log(JSON.stringify(result, null, 2));
});
