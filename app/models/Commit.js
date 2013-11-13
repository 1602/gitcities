module.exports = function(compound, Commit) {
    Commit.prototype.getWeight = function(daysAgo, isMayor) {
        return Commit.calcWeight(daysAgo, isMayor, this);
    };

    Commit.calcWeight = function(daysAgo, isMayor, ci) {
        if (daysAgo < 4) daysAgo = 4;
        var gravity = Math.log(daysAgo) * Math.log(daysAgo / 2);
        return  (isMayor ? 10 : 50) / gravity + (isMayor ? 0.05 : 0.2);
    };
};
