const { User, Post } = require('../models');

class PostsController {
  static async getAll(req, res, next) {
    res.send('This was supposed to be a put');
  }

  static async getNetworkFeed(req, res, next) {
    try {
      const { status, response } = await Post.getTop();
      const topPosts = response.map((post, index) => {
        const viewPost = {
          index,
          id: post.id,
          userId: post.userId,
          title: post.title,
          excerpt: `${post.text.substring(0, 64)}...`,
          date: post.date,
          author: post.author === 'null null'
            ? undefined : post.author,
          random: Math.floor((Math.random() * 12) + 0), // Temp
        };
        return viewPost;
      });


      if (status === 200) {
        res.render('network', { topPosts });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getHomeFeed(req, res, next) {
    try {
      const { status, response } = await Post.getHomeFeed(req.cookies[`${process.env.COOKIE_NAME}`]);
      let posts = [];

      if (response) {
        posts = response.data.map((post, index) => {
          const viewPost = {
            index,
            id: post.id,
            userId: post.userId,
            title: post.title,
            excerpt: `${post.text.substring(0, 128)}...`,
            date: post.date,
            author: post.author === 'null null'
              ? undefined : post.author,
            random: Math.floor((Math.random() * 12) + 0), // Temp
          };
          return viewPost;
        });
      }
      res.render('home', { posts });
    } catch (error) {
      next(error);
    }
  }

  static async get(req, res, next) {
    try {
      const { status, response: post } = await Post.get(req.params.postId);

      if (status === 200) {
        const { response: author } = await User.get(post.userId);
        post.comments.forEach((comment) => {
          comment.author = comment.author === 'null null'
            ? undefined : comment.author;
          comment.sessionOwns = res.locals.hasSession
            ? comment.userId === req.session.user.id : false;
        });
        const viewFields = {
          ...post,
          author,
          isAuthor: res.locals.hasSession ? (author.id === req.session.user.id) : false,
        };
        res.render('posts/show', viewFields);
      } else if (status >= 400) {
        res.redirect('/error');
      }
    } catch (error) {
      next(error);
    }
  }

  static async insert(req, res, next) {
    try {
      const { status, response: newPost } = await Post.insert(req.body, req.cookies[`${process.env.COOKIE_NAME}`]);
      if (status === 201) {
        res.redirect(`posts/${newPost.id}`);
      } else if (status === 409) {
        res.redirect('/error');
      }
    } catch (error) {
      next(error);
    }
  }

  static async edit(req, res, next) {
    try {
      const { status, response: post } = await Post.get(req.params.postId);
      if (req.session.user.id === post.userId) {
        res.render('posts/edit', post);
      } else {
        const error = {
          status: 403,
          message: 'You don\'t have permission to do this.',
        };
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { status, response: post } = await Post.update({
        id: req.params.postId,
        ...req.body.post,
      },
      req.cookies[`${process.env.COOKIE_NAME}`]);
      res.redirect(`${req.params.postId}`);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await Post.delete(req.params.postId, req.cookies[`${process.env.COOKIE_NAME}`]);
      res.redirect(`/users/${req.session.user.id}`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PostsController;
