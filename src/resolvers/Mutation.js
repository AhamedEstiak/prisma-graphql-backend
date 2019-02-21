const Mutations = {
    // TODO: check if they are logged in

    async createItem(parent, args, ctx, info) {
        const item = await ctx.db.mutation.createItem({
            data: { ...args }
        }, info);

        console.log(item);
        return item;
    },

    async updateItem(parent, args, ctx, info) {
        // first take a copy of updates
        const updates = { ...args };
        // remove id from updates
        delete updates.id;
        // run the update method
        return await ctx.db.mutation.updateItem({
            data: updates,
            where: {
                id: args.id
            }
        }, info);
    },

    async deleteItem(parent, args, ctx, info) {
        const where = { id: args.id };
        // 1. find item
        const item = await ctx.db.query.item({ where }, `{id title}`);
        // 2. check if the item is owned by the user or have the permissions
        // TODO
        // 3. delete the item
        return ctx.db.mutation.deleteItem({ where }, info);
    }
};

module.exports = Mutations;
