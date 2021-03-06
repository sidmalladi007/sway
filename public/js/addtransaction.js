$(document).ready(function() {
  $('#addtransaction').submit(function(event) {
      event.preventDefault();
      processNew();
  });

  function processNew() {
  var name = $('#purchasename').val();
  var amount = $('#purchaseamount').val();
  var datetime = $('#purchasedate').val();
  var datePreFormat = datetime.split(" ")[0]
  var dateComponents = datePreFormat.split("/");
  var date = dateComponents[2] + "-" + dateComponents[0] + "-" + dateComponents[1]
  var gpa = $('#newGPA').val();
  var reqURL = "/shopper/addtransaction?name=" + name + "&" + "amount=" + amount + "&date=" + date;
  $.ajax({
  url: reqURL,
  type: 'POST',
  success: function(result) {
    var row = $("<tr></tr>");
    var col1 = $("<td class='text-center'>" + name + "</td>");
    var col2 = $("<td class='text-center'>" + amount + "</td>");
    var col3 = $("<td class='text-center'>" + date + "</td>");
    row.append(col1, col2, col3).prependTo("#bootstrap-table");
    }
  });
}
});
