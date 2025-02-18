import {Field, ObjectType} from '@nestjs/graphql';

@ObjectType()
export class User {
    @Field({nullable: true})
    id?: number;

    @Field()
    fullname: string;

    @Field()
    email?: string;

    @Field(() => String, { nullable: true })
    avatarUrl: string | null;

    @Field({nullable: true})
    password?: string;

    @Field({nullable: true})
    createdAt?: Date;
    @Field({nullable: true})
    updatedAt?: Date;

}