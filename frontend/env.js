
var set_auth = function(){
    Object.assign(process.env,{
        // RallyUser:'michael.korostelev@bkfs.com',
        RallyUser:'michael.korostelev@heavywater.solutions',
        // RallyPassword:'HAL9000!',
        RallyPassword:'4234475aA!',
        slack_bot_token:'xoxb-366969487939-601176820245-X4hxQyblD2BZoU1XkqlSvL5R',
        slack_user_token:'xoxp-366969487939-513303557424-591969172801-b3ac8952a608f75243d290c72598a652',
        git_token:'1211ebd8733171c1176093246682b8a711fcde7d'
    })
}

module.exports={
    set_auth
}