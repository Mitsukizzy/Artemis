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
$sankey_arr = array();
unset($response); 

// Scan table and loop through rows to add to table
$response = $dynamodb->scan([
    'TableName' => $tableName
]);

// Actually prints out the data
foreach ($response['Items'] as $key => $value) {
    foreach ($value['Items']['M'] as $iKey => $iValue) {            
        $sankey_arr[] = array($iKey, 'Carbs', $value['Carbs']['N']);
        $sankey_arr[] = array($iKey, 'Fiber', $value['Fiber']['N']);      
        $sankey_arr[] = array($iKey, 'Sugars', $value['Sugars']['N']);       
        $sankey_arr[] = array($iKey, 'Protein', $value['Protein']['N']);         
        $sankey_arr[] = array($iKey, 'Fats', $value['Fats']['N']);           
    }
} 

echo json_encode($sankey_arr);
return json_encode($sankey_arr);
?>