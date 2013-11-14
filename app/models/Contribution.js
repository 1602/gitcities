module.exports = function(compound, Contribution) {
    Contribution.belongsTo('user');
    Contribution.belongsTo('repository');

    Contribution.prototype.formatWeight = function() {
        return this._weight ? Math.round(this.weight * 100) / 100 : 0;
    };
};
