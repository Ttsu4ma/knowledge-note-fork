import mustache from 'mustache';
// Viteのルールとして、インポートする対象のファイルをそのまま取得するためには相対パスの末尾に"?raw"を付与する必要がある
// この場合、テンプレートのHTMLファイルをそのまま取得したいので"?raw"を末尾に付与している
// 参照: https://ja.vite.dev/guide/assets.html#importing-asset-as-string
import html from '../templates/mypage.html?raw';

export const mypage = () => {
  const app = document.querySelector('#app');
  app.innerHTML = mustache.render(html, { hoge: 'HOME' });

  document
    .querySelector('#mypage-form')  // フォームのIDを指定
    .addEventListener('submit', (e) => {
      // フォーム送信のデフォルト動作を無効化（ページのリロードを防ぐ）
      e.preventDefault();

      /** @type {HTMLButtonElement} */
      const button = e.target.querySelector('button[type="submit"]');
      button.disabled = true;  // ボタンを無効化して二重送信を防ぐ

      // フォームのデータを取得
      const data = Object.fromEntries(new FormData(e.target).entries());

      // サーバーにデータを送信
      fetch('/api/v1/uer-update', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),  // フォームのデータをJSON形式で送信
        method: 'POST',
      })
        .then((res) =>
          new Promise((resolve, reject) =>
            res.ok ? resolve(res.json()) : reject(res.text())  // 成功したらJSON、失敗したらエラーメッセージ
          )
        )
        .then((json) => {
          console.log(json);  // サーバーからのレスポンスをコンソールに出力

          // 成功メッセージを表示
          document.querySelector('#mypage-form p strong').innerHTML = "保存が成功しました";
        })
        .catch((err) => {
          console.error(err);  // エラーハンドリング
          // 失敗メッセージを表示
          document.querySelector('#mypage-form p strong').innerHTML = "保存が失敗しました";
        })
        .finally(() => {
          button.disabled = false;  // ボタンを再度有効化
        });
    });
};