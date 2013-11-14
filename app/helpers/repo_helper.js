exports.avatar = function(member, size) {
    if (member.u.avatar) {
        return member.u.avatar + (size && member.u.avatar.indexOf('?') > -1 ? '&s=' + (size * 2) : '');
    } else {
        return '/users/avatar/' + (member.u.login || member.userId);
    }
}
