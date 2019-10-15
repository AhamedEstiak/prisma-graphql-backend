const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const Mutations = {
    // TODO: check if they are logged in

    async createItem(parent, args, ctx, info) {
        if (!ctx.request.userId) {
            throw new Error('You must be logged in to do that');
        }
        const item = await ctx.db.mutation.createItem({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId,
                    }
                },
                 ...args 
                }
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
        const item = await ctx.db.query.item({ where }, `{ id 
            title}`);
        // 2. check if the item is owned by the user or have the permissions
        // TODO
        // 3. delete the item
        return ctx.db.mutation.deleteItem({ where }, info);
    },

    async signup(parent, args, ctx, info) {
        // lowercase user email
        args.email = args.email.toLowerCase();
        // hash user password  
        const password = await bcrypt.hash(args.password, 10);
        // Create user in the database
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER'] },
            },
        }, info);
        // Create Jwt token for user
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // We set the jwt as a cookie on the response
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        });
        // Finally return the user to the browser
        return user;
    },

    async signin(parent, { email, password }, ctx, info) {
        // 1. check if there is a user with that email
        const user = await ctx.db.query.user({ where: { email: email } });
        if (!user) {
            throw new Error(`No such user found for email ${email}`);
        }
        // 2. check if their password is correct
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new Error('Invalid Password!');
        }
        // 3. generate the JWT token
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // 4. set the cookie with the token
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        // 5. return the user
        return user;
    },

    signout(parent, args, ctx, info) {
        ctx.response.clearCookie('token');
        return { message: "Signout successfull" }
    },

    async resetRequest(parent, args, ctx, info) {
        // 1. Check if this is a real user
        const user = await ctx.db.query.user({ where: {email: args.email}});
        if (!user) {
            throw new Error(`No such user found for email ${args.email}`);
        }
        // 2. Set the reset token and expiry for that user
        const randomBytePromisified = promisify(randomBytes);
        const resetToken = (await randomBytePromisified(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
        const res = await ctx.db.mutation.updateUser({
            where: { email: args.email },
            data: { resetToken, resetTokenExpiry }
        })
        console.log(res);
        return { message: 'Thanks!'}
        // 3. email the user that reset token
    },

    async resetPassword(parent, args, ctx, info) {
        // 1. Check if the password match
        if (args.password !== args.confirmPassword) {
            throw new Error('Password don\'t match');
        }
        // 2. Check if its a legit reset token
        // 3. Check if its expired
        const [user] = await ctx.db.query.users({
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000
            }
        });
        if (!user) {
            throw new Error('This token is either invalid or expired!');
        }
        // 4. Hash their password
        const password = await bcrypt.hash(ars.password, 10);
        // 5. Save the new password and remove their reset token fields
        const updatedUser = await ctx.db.mutation.updateUser({
            where: {email: user.email},
            data: {
                password,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        // 6. Generate JWT
        const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
        // 7. set the cookie with the token
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        })
        // 8. Return the user
        return updatedUser;
    },

};

module.exports = Mutations;
