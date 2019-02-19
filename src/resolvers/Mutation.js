const Mutations = {
    // TODO: check if they are logged in

    async createItem(parent, args, ctx, info) {
        const item = await ctx.db.mutation.createItem({
            data: { ...args }
        }, info);

        console.log(item);
        return item;
    }
};

module.exports = Mutations;
