var xhr = new XMLHttpRequest(); // initialize our XMLHttpRequest object
var response;
var queryItem = "banana"; // whatever item we're eating goes here
var url = "https://api.nutritionix.com/v1_1/search/"+queryItem+"?fields=item_name%2Citem_id%2Cbrand_name%2Cnf_calories%2Cnf_total_fat&appId=27d56daa&appKey=801497a4013af4e17085d5d46e305d0e";

xhr.open('GET', url, true); // change 3rd parameter to false for synchronous
xhr.send();
xhr.addEventListener("readystatechange", processRequest, false);

function processRequest(e) {
	if (xhr.readyState == 4 && xhr.status == 200) {
	// time to partay!!!
	    response = JSON.parse(xhr.responseText);
	    console.log(response);
	    console.log(response['hits'][0]['fields']['item_name']); // Retreives the item name
	    console.log(response['hits'][0]['fields']['nf_calories']); // Retreives calories
	    console.log(response['hits'][0]['fields']['nf_total_fat']); // Retrieves fat
	}
}