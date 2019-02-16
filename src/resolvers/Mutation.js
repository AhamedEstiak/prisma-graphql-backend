const Mutations = {
    // check if the user is logged in

    async createItem(parent, args, ctx, info) {
        const item = await ctx.db.mutation.createItem({
            data: { ...args }
        }, info);

        console.log(item);
        return item;
    }

    // createDog(parent, args, ctx, info) {
    //     // create a dog
    //     global.dog = global.dog || [];
    //     const newDog = {name: args.name};
    //     global.dog.push(newDog);
    //     return newDog;
    // }
};

module.exports = Mutations;
