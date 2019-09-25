import Crowi from 'server/crowi'

export default (crowi: Crowi) => {
  // var debug = Debug('crowi:routes:installer')
  const Config = crowi.model('Config')
  const User = crowi.model('User')
  const actions = {} as any

  actions.index = function(req, res) {
    return res.render('installer')
  }

  actions.createAdmin = function(req, res) {
    var registerForm = req.body.registerForm || {}
    var language = req.language || 'en'

    if (req.form.isValid) {
      var name = registerForm.name
      var username = registerForm.username
      var email = registerForm.email
      var password = registerForm.password

      User.createUserByEmailAndPassword(name, username, email, password, language, function(err, userData) {
        if (err) {
          req.form.errors.push('管理ユーザーの作成に失敗しました。' + err.message)
          // TODO
          return res.render('installer')
        }

        userData.makeAdmin(async function(err, userData) {
          if (err) return

          try {
            await Config.applicationInstall()

            // login処理
            req.user = req.session.user = userData
            req.flash('successMessage', 'Crowi のインストールが完了しました！はじめに、このページでこの Wiki の各種設定を確認してください。')
            return res.redirect('/admin/app')
          } catch (err) {
            // TODO
          }
        })
      })
    } else {
      return res.render('installer')
    }
  }

  return actions
}
