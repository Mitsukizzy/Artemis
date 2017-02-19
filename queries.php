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

// Scan table and loop through rows to add to table
$response = $dynamodb->scan([
    'TableName' => $tableName
]);

// Actually prints out the data
foreach ($response['Items'] as $key => $value) {
    echo "\n";
    echo '<tr>';
    foreach ($value['Items']['M'] as $iKey => $iValue) {                                
        echo '    <td>' . ucwords($iKey) . '</td>';
        echo '    <td class="numeric">' . $iValue['N'] . '</td>';
    }
    echo '    <td class="numeric">' . $value['Calories']['N'] . '</td>';
    echo '    <td>' . $value['TimeOfLog']['S'] . '</td>';
    echo '</tr>';
} 

?>