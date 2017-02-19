<?php
ini_set('display_errors', 1);
require '/home/isaben1/php/aws/aws-autoloader.php';

date_default_timezone_set('UTC');

use Aws\DynamoDb\Exception\DynamoDbException;
use Aws\DynamoDb\Marshaler;

$sdk = new Aws\Sdk([
    'region'   => 'us-east-1',
    'version'  => 'latest',
    'endpoint' => 'https://dynamodb.us-east-1.amazonaws.com',
    'credentials' => [
        'key'    => 'AKIAJKTVMITXX54WN63A',
        'secret' => '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'
    ]
]);


$dynamodb = $sdk->createDynamoDb();
$marshaler = new Marshaler();

$tableName = 'LoggedItems';
unset($response); 

$carbs = 0;
$fiber = 0;
$sugars = 0;
$protein = 0;
$fats = 0;

// Scan table and loop through rows to add to table
$response = $dynamodb->scan([
    'TableName' => $tableName
]);

// Actually prints out the data
foreach ($response['Items'] as $key => $value) {
    $carbs +=  $value['Carbs']['N'];
    $fiber +=  $value['Fiber']['N'];
    $sugars +=  $value['Sugars']['N'];
    $protein +=  $value['Protein']['N'];
    $fats +=  $value['Fats']['N'];
} 
$php_array = array(
    array("Carbs", "Fiber", "Sugars", "Protein", "Fats"), 
    array($carbs, $fiber, $sugars, $protein, $fats), 
);

echo json_encode($php_array);
return json_encode($php_array);
?>