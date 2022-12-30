import { ApolloServer} from '@apollo/server';
import { startStandaloneServer, } from '@apollo/server/standalone';
import { v1 as uuid } from 'uuid';
import { GraphQLError } from 'graphql';
import axios from 'axios';

const persons = [
    {
        name: 'John',
        phone: '1234567890',
        street: '123 Main St',
        city: 'Maha Sarakham',
        id: "1",
    },
    {
        name: 'Jane',
        phone: '0987654321',
        street: '456 Main St',
        city: 'New York',
        id: "2",
    },
    {
        name: 'Jack',
        phone: '1234567890',
        street: '123 Main St',
        city: 'California',
        id: "3",

    },
];
const typeDefs = `#graphql
    enum YesNo {
        YES
        NO
    }

    type Address {
        street: String!
        city: String!
    }
    type Person {
        name: String!
        phone: String
        adress: Address!
        id: ID!
    }

    type Query {
        personCount: Int!
        allPersons(phone:YesNo): [Person]!
        findPerson(name:String!): Person
    }
    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
        editNumber(
        name: String!
        phone: String!
        ): Person
    }
`;

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const {data:personsFromRestApi }=await axios.get('http://localhost:3001/persons')
            console.log(personsFromRestApi)
            if (!args.phone) return personsFromRestApi
            
            const byPhone = (person) =>
                args.phone === 'YES' ? person.phone : !person.phone
            return personsFromRestApi.filter(byPhone)
        },
        findPerson: (root, args) => {
            const { name } = args
            return persons.find(p => p.name === args.name)
        },
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name === args.name)) {
                throw new GraphQLError("Name must be unique", {
                    extensions: {
                        code: 'BadUserInput',

                    },
                });
            }
            const person = { ...args, id: uuid() }
            persons.push(person)
            return person
        },
        editNumber: (root, args) => {
            const personIndex = persons.findIndex(p => p.name === args.name)
            if (personIndex === -1) {
                throw new GraphQLError("Name not found", {
                    extensions: {
                        code: 'BadUserInput',
                    }
                });
            }
            const person = persons[personIndex]
            const updatedPerson = { ...person, phone: args.phone }
            persons[personIndex] = updatedPerson
            return updatedPerson
        },
    },
    
    Person: {
        adress: (root) => {
            return {
                street: root.street,
                city: root.city,
            }
        },
    },
};

const server = new ApolloServer({
    typeDefs: typeDefs,
    resolvers
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);