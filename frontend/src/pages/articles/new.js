// import mustache from 'mustache';
// // Viteのルールとして、インポートする対象のファイルをそのまま取得するためには相対パスの末尾に"?raw"を付与する必要がある
// // この場合、テンプレートのHTMLファイルをそのまま取得したいので"?raw"を末尾に付与している
// // 参照: https://ja.vite.dev/guide/assets.html#importing-asset-as-string
// import html from '../../templates/articles/new.html?raw';

// // 当授業ではCSRF攻撃に対して脆弱なコードとなっていますが、実装が煩雑になるので考慮せずに実装しますが
// // 実際にログインを伴うサイト等でフォーム送信などを行う処理にはCSRF攻撃に対する対策CSRFトークンも含めるなどの対策を実施してください
// // 参考: https://developer.mozilla.org/ja/docs/Glossary/CSRF

// /**
//  * 記事新規作成時の処理の関数
//  */
// export const articlesNew = () => {
//   const app = document.querySelector('#app');
//   // templates/articles/new.html を <div id="app"></div> 要素内に出力する
//   app.innerHTML = mustache.render(html, {});

//   // TODO: new.htmlにかかれているHTMLに入力の変更があったら画面右側のプレビューの内容を入力した内容に応じたものに変換する
//   // 処理...
  
//   // "公開" ボタンを押下された際にPOSTメソッドで /api/v1/articles に対してAPI通信を fetch で送信する
// };

import { parse } from 'marked';
import DOMPurify from 'dompurify';
import mustache from 'mustache';
import html from '../../templates/articles/new.html?raw';
// ページ遷移するための関数を呼び出す
import { navigate } from '../../utils/router';

/**
 * 記事新規作成時の処理の関数
 */
export const articlesNew = () => {
  const app = document.querySelector('#app');
  // templates/articles/new.html を <div id="app"></div> 要素内に出力する
  app.innerHTML = mustache.render(html, {});

  // DOMの要素を取得
  const textarea = document.querySelector('#editor-textarea');
  const previewArea = document.querySelector('#preview-area');
  const form = document.querySelector('#articles-new-form');
  const submitButton = form.querySelector('button[type="submit"]');

  // Markdown入力があったときにプレビューを更新する関数
  const updatePreview = () => {
    const markdownText = textarea.value; // テキストエリアの値を取得
    const htmlText = DOMPurify.sanitize(parse(markdownText)); // MarkdownをHTMLに変換してサニタイズ
    previewArea.innerHTML = htmlText; // プレビューエリアに結果を表示
  };

  // 入力のたびにプレビューを更新
  textarea.addEventListener('input', updatePreview);

  // 初期表示のプレビューも更新
  updatePreview();

  // "公開" ボタンを押したときの処理
  submitButton.addEventListener('click', async (event) => {
    event.preventDefault(); // フォーム送信をキャンセル

    // フォームデータの取得
    const title = form.querySelector('input[name="title"]').value;
    const body = textarea.value;

    // フォームデータをPOSTリクエストで送信
    const response = await fetch('/api/v1/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // JSON形式で送信
      },
      body: JSON.stringify({ title, body }), // タイトルと本文をJSON形式で送信
    });

    // レスポンスをJSONとして解析
    const jsonResponse = await response.json();

    if (jsonResponse.isSuccess) {
      // 成功した場合、/mypage へ遷移
      navigate('/mypage');
    } else {
      // エラー時の処理
      alert('記事の公開に失敗しました: ' + jsonResponse.message);
    }
  });
};