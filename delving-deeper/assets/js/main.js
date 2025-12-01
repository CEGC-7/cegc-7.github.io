$(function(){
  $("#table1_1").load("tables/table1_1_mod.html"); 
  $("#table1_x").load("tables/table1_x.html"); 
  $("#table1_2").load("tables/table1_2_mod.html"); 
  $("#table1_3").load("tables/table1_3.html"); 
  $("#table1_4").load("tables/table1_4.html"); 
  $("#table1_5").load("tables/table1_5.html"); 
  $("#table1_6").load("tables/table1_6.html"); 
  $("#table1_7").load("tables/table1_7.html"); 
  $("#table1_8").load("tables/table1_8.html"); 
  $("#table1_9").load("tables/table1_9.html"); 
  $("#table1_10").load("tables/table1_10.html"); 
  $("#table1_11").load("tables/table1_11.html"); 
  $("#table1_12").load("tables/table1_12.html"); 
  $("#table1_13").load("tables/table1_13.html"); 
  $("#table1_14").load("tables/table1_14.html"); 
  $("#table1_15").load("tables/table1_15.html"); 
  $("#table1_16").load("tables/table1_16.html"); 
  $("#table1_17").load("tables/table1_17.html"); 
  $("#table1_18").load("tables/table1_18.html"); 
  $("#table1_19").load("tables/table1_19.html"); 
  $("#table1_20").load("tables/table1_20.html"); 
  $("#table1_21").load("tables/table1_21.html"); 
  $("#table1_22").load("tables/table1_22.html"); 
  $("#table1_23").load("tables/table1_23.html"); 

  $("#table2_1").load("tables/table2_1.html"); 
  $("#table2_2").load("tables/table2_2.html"); 
  $("#table2_3").load("tables/table2_3.html"); 
  $("#table2_4").load("tables/table2_4.html"); 
  $("#table2_5").load("tables/table2_5.html"); 
  $("#table2_6a").load("tables/table2_6a.html"); 
  $("#table2_6b").load("tables/table2_6b.html"); 
  $("#table2_7").load("tables/table2_7.html"); 
  $("#table2_8").load("tables/table2_8_mod.html"); 
  $("#table2_9").load("tables/table2_9.html"); 
  $("#table2_10").load("tables/table2_10.html"); 
  $("#table2_11").load("tables/table2_11.html"); 
  $("#table2_12").load("tables/table2_12_mod.html"); 
  $("#table2_13").load("tables/table2_13_mod.html"); 
  $("#table2_14").load("tables/table2_14.html"); 
  $("#table2_15").load("tables/table2_15.html"); 
  $("#table2_16").load("tables/table2_16.html"); 
  $("#table2_17a").load("tables/table2_17a.html"); 
  $("#table2_17b").load("tables/table2_17b.html"); 
  $("#table2_17c").load("tables/table2_17c.html"); 
  $("#table2_18").load("tables/table2_18.html"); 
  $("#table2_19").load("tables/table2_19.html"); 
  $("#table2_20").load("tables/table2_20.html"); 
  $("#table2_21").load("tables/table2_21.html"); 
  $("#table2_22").load("tables/table2_22.html"); 
  $("#table2_23").load("tables/table2_23.html"); 
  $("#table2_24").load("tables/table2_24.html"); 
  $("#table2_25").load("tables/table2_25.html"); 
  $("#table2_26").load("tables/table2_26.html"); 
  $("#table2_27").load("tables/table2_27.html"); 
  $("#table2_28").load("tables/table2_28.html"); 

  $("#table3_1a").load("tables/table3_1a.html"); 
  $("#table3_1b").load("tables/table3_1b.html"); 
  $("#table3_1c").load("tables/table3_1c.html"); 
  $("#table3_1d").load("tables/table3_1d.html"); 
  $("#table3_1e").load("tables/table3_1e.html"); 
  $("#table3_1f").load("tables/table3_1f.html"); 
  $("#table3_2").load("tables/table3_2.html"); 
  $("#table3_3").load("tables/table3_3.html"); 
  $("#table3_4").load("tables/table3_4.html"); 
  $("#table3_5").load("tables/table3_5.html"); 
  $("#table3_6").load("tables/table3_6.html"); 
  $("#table3_7").load("tables/table3_7.html"); 
  $("#table3_8").load("tables/table3_8.html"); 
  $("#table3_9").load("tables/table3_9.html"); 
  $("#table3_10").load("tables/table3_10.html"); 
  $("#table3_11").load("tables/table3_11.html"); 
  $("#table3_12").load("tables/table3_12.html"); 
  $("#table3_13").load("tables/table3_13.html"); 
  $("#table3_14").load("tables/table3_14.html"); 
  $("#table3_15").load("tables/table3_15.html"); 
  $("#table3_16").load("tables/table3_16.html"); 
  $("#table3_17").load("tables/table3_17.html"); 
  $("#table3_18").load("tables/table3_18.html"); 
  $("#table3_19").load("tables/table3_19.html"); 
  $("#table3_20").load("tables/table3_20.html"); 
  $("#table3_21").load("tables/table3_21.html"); 
  $("#table3_22").load("tables/table3_22.html"); 
  $("#table3_23").load("tables/table3_23.html"); 
  $("#table3_24").load("tables/table3_24.html"); 
  $("#table3_25").load("tables/table3_25.html"); 
  $("#table3_26").load("tables/table3_26.html"); 
  $("#table3_27").load("tables/table3_27.html"); 
  $("#table3_28").load("tables/table3_28.html"); 
  $("#table3_29").load("tables/table3_29.html"); 
  $("#table3_30").load("tables/table3_30.html"); 
  $("#table3_31").load("tables/table3_31.html"); 
  $("#table3_32").load("tables/table3_32.html"); 
  $("#table3_33").load("tables/table3_33.html"); 
  $("#table3_34").load("tables/table3_34.html"); 
  
  // $("h1").click(function(evt) {
  //   evt.preventDefault();
  //   var sec = $(this).data("acc");
  //   $("." + sec).toggle("fast");
  // });
  
  $(".btn").click(function(evt) {
    var href = $(this).attr("href");
    $('html,body').animate({scrollTop: $(href).offset().top},'fast');
    window.location.hash = href;
    //$(href).click();
  });
  
  var hash = window.location.hash;
  if (hash) {
    setTimeout(function() {
      $('html,body').animate({scrollTop: $(hash).offset().top},'fast');
    }, 1000);
  }
  
  $("#sidebar-blocker").click(function(evt) {
    console.log("blocker");
    evt.preventDefault();
    $(".toc-open-btn").removeClass("close");
    $("#sidebar-wrapper").removeClass("show");
    $("#sidebar-blocker").removeClass("show");
  });
  
  $(".toc-open-btn").click(function(evt) {
    evt.preventDefault();
    if ($(this).hasClass("close")) {
      $(this).removeClass("close");
    } else {
      $(this).addClass("close");
    }
    if ($("#sidebar-wrapper").hasClass("show")) {
      $("#sidebar-wrapper").removeClass("show");
      $("#sidebar-blocker").removeClass("show");
    } else {
      $("#sidebar-wrapper").addClass("show");
      $("#sidebar-blocker").addClass("show");
    }
  });
  
});