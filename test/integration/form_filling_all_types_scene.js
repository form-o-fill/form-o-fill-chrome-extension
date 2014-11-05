describe("filling different types of fields", function() {

  it("fills all known types", function(){
    Tests.visit("all-types").then(function () {
      Tests.importRules().then(function () {
        // The rule is set to autorun so it will already have been executed
        expect($("input[type=text]").getAttribute("value"), "input[type=text]").to.become("input[type=text]");
        expect($("input[type=radio]").isSelected(), "input[type=radio]").to.become(true);
        expect($("input[name='checkbox-value']").isSelected(), "input[name='checkbox-value']").to.become(true);
        expect($("input[name='checkbox-true']").isSelected(), "input[name='checkbox-true']").to.become(true);
        expect($("input[name='checkbox-false']").isSelected(), "input[name='checkbox-false']").to.become(false);
        expect($("input[type=button]").getAttribute("value"), "input[type=button]").to.become("input[type=button]");
        expect($("input[type=image]").getAttribute("src"), "input[type=image]").to.become("http://localhost:8889/form-o-fill-testing/animage.png");
        expect($("input[type=password]").getAttribute("value"), "input[type=password]").to.become("input[type=password]");

        // HTML 5
        expect($("input[type=search]").getAttribute("value"), "input[type=search]").to.become("input[type=search]");
        expect($("input[type=email]").getAttribute("value"), "input[type=email]").to.become("someone@example.com");
        expect($("input[type=url]").getAttribute("value"), "input[type=url]").to.become("http://form-o-fill.github.io");
        expect($("input[type=tel]").getAttribute("value"), "input[type=tel]").to.become("491234567890");
        expect($("input[type=range]").getAttribute("value"), "input[type=range]").to.become("100");
        expect($("input[type=date]").getAttribute("value"), "input[type=date]").to.become("2014-11-04");
        expect($("input[type=month]").getAttribute("value"), "input[type=month]").to.become("2014-06");
        expect($("input[type=week]").getAttribute("value"), "input[type=week]").to.become("2014-W42");
        expect($("input[type=datetime]").getAttribute("value"), "input[type=datetime]").to.become("1996-12-19T16:39:57-08:00");
        expect($("input[type=datetime-local]").getAttribute("value"), "input[type=datetime-local]").to.become("1996-12-19T16:39:57.123");
        expect($("input[type=color]").getAttribute("value"), "input[type=color]").to.become("#ff0000");

        // select
        expect($("select.single").getAttribute("value"), "select.single").to.become("option1");
        expect(element.all(by.css("select.multiple option:checked")).count(), "select.multiple").to.become(2);

        expect($(".textarea").getAttribute("value"), "textarea").to.become("textarea");
      });
    });
  });
});
