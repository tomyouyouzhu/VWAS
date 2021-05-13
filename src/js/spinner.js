!function() {
    var cnvSpinner = {
        'title': "Spinner",
    };

    cnvSpinner.start = function(div_id, message) {
        if(!message)
            message = 'Loading...';
        document.getElementById(div_id+'_div').style.display = "block";
        document.getElementById(div_id).style.display = "block";
        document.getElementsByClassName("vue-simple-spinner-text")[0].innerHTML = message;
    }
    cnvSpinner.stop = function(div_id) {
        document.getElementById(div_id).style.display = "none";
        document.getElementById(div_id+'_div').style.display = "none";
    }

    if (typeof define === "function" && define.amd) 
        define(cnvSpinner); 
    else if (typeof module === "object" && module.exports) 
        module.exports = cnvSpinner;
    this.cnvSpinner = cnvSpinner;

}(); // end spinner function scope





