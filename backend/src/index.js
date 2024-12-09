import express from 'express';
import swagger from 'swagger-ui-express';
import yaml from 'yaml';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { hashSync, compareSync } from 'bcrypt';
import session from 'express-session';
import e from 'express';

const openapi = yaml.parse(fs.readFileSync('./src/openapi.yaml', 'utf8'));
const prisma = new PrismaClient();
/** 1時間のミリ秒 */
const _1h = 1000 * 60 * 60;

// Expressアプリケーションを作成
const app = express()
  // リクエストボディのJSONをパースするミドルウェア
  .use(express.json())
  .use(session({
    // 本来は secret というプロパティの通りでこの値は
    // サーバーの環境変数なりで、コードに残さない形にする
    secret: 'lk;w34$lfaJAfb',
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: {
      // https で常時接続するなら secure: true としたほうが良い
      // secure: true,
      httpOnly: true,
      // 1時間保持
      maxAge: _1h,
    },
  }))
  .use('/api/docs', swagger.serve, swagger.setup(openapi));

app.post('/api/v1/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { username, password } = req.body;
  await prisma.user
    .findFirstOrThrow({ where: { username } })
    .then(record => new Promise((res, rej) => compareSync(password, record.password)
      ? res(record)
      : rej()))
    .then(record => new Promise((res, rej) => {
      req.session.regenerate((err) => {
        if (err) return rej(err);
        return res(record);
      });
    }))
    .then(record => {
      console.debug(record);
      req.session.user = record;
      res.cookie('user.id', record.id, { maxAge: _1h });
      res.cookie('user.username', record.username, { maxAge: _1h });
      res.json({ message: 'OK' });
    })
    .catch(err => {
      console.error(err);
      res.status(400).json({ message: 'ログイン失敗: IDまたはパスワードが無効です。' });
    });
});

// ユーザー登録処理
app.post('/api/v1/register', async (req, res) => {
  console.debug(req.body);
  const { email, password, username } = req.body;
  await prisma.user
    .create({
      select: {
        id: true,
        email: true,
        username: true,
      },
      data: {
        email,
        username,
        password: hashSync(password, 10),
      }
    })
    .then(record => new Promise((res, rej) => {
      req.session.regenerate((err) => {
        if (err) return rej(err);
        return res(record);
      });
    }))
    .then(record => {
      req.session.user = record;
      console.log(req.session);
      res.cookie('user.id', record.id, { maxAge: _1h });
      res.cookie('user.username', record.username, { maxAge: _1h });
      res.json({ isSuccess: true, message: 'OK' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ isSuccess: false, message: '不明なエラーが発生しました' })
    });
});

//保存処理
app.post('/api/v1/uer-update',async (req,res) => {
  const{username,email,password} = req.body;
  const data ={};
  if(username){
    data.username = username;
  }
  if(email){
    data.email = email;
  }
  if(password){
    data.password = hashSync(password,10);
  }
  await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: data,
  })
    .then(result => {
      res.json({ isSuccess: true, message: '保存が成功しました' });
    })
    .catch(error => {
      res.json({ isSuccess: false, message: '保存が失敗しました' });
    })
});

// ログアウト処理
app.get('/api/v1/logout', async (req, res) => {
  // ログイン状態を破棄する
  req.session.destroy();
  res.cookie('user.username', '', { maxAge: 0 });
  res.cookie('user.id', '', { maxAge: 0 });
  res.redirect('/');
});

app.get('/api/v1/user/me', async (req, res) => {
  if (req.session.user) {
    res.cookie('user.id', req.session.user.id, { maxAge: _1h });
    res.cookie('user.username', req.session.user.username, { maxAge: _1h });
    res.json({
      isSuccess: true,
      'user.id': req.session.user.id,
      'user.username': req.session.user.username
    });
  } else {
    res.status(400).json({
      isSuccess: false,
      message: 'Not login'
    });
  }
});

// サーバーを起動
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
