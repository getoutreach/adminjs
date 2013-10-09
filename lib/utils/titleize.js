import humanize from 'adminjs/utils/humanize';

function titleize(word) {
   var result = humanize(word);

   result = result.
     replace(/\b(?:<!['’`])[a-z]/).
     toLowerCase().
     replace(/^.|\s\S/g, function(a) { return a.toUpperCase(); });

  return result;
}

export default titleize;