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
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="Dashboard">
    <meta name="keyword" content="Artemis, fitness, nutrition, amazon, alexa, log, food, water">

    <title>Artemis - Track your nutrition intake using Amazon Alexa</title>

    <!-- Bootstrap core CSS -->
    <link href="assets/css/bootstrap.css" rel="stylesheet">
    <!--external css-->
    <link href="assets/font-awesome/css/font-awesome.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="assets/css/zabuto_calendar.css">
    <link rel="stylesheet" type="text/css" href="assets/js/gritter/css/jquery.gritter.css" />
    <link rel="stylesheet" type="text/css" href="assets/lineicons/style.css">    
    
    <!-- Custom styles for this template -->
    <link href="assets/css/style.css" rel="stylesheet">
    <link href="assets/css/style-responsive.css" rel="stylesheet">

    <script src="assets/js/chart-master/Chart.js"></script>
    <script src="https://sdk.amazonaws.com/js/aws-sdk-2.16.0.min.js"></script>
    
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
      <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>

  <body>

  <section id="container" >
      <!-- **********************************************************************************************************************************************************
      TOP BAR CONTENT & NOTIFICATIONS
      *********************************************************************************************************************************************************** -->
      <!--header start-->
      <header class="header black-bg">
              <div class="sidebar-toggle-box">
                  <div class="fa fa-bars tooltips" data-placement="right" data-original-title="Toggle Navigation"></div>
              </div>
            <!--logo start-->
            <a href="index.php" class="logo"><b>ARTEMIS</b></a>
            <!--logo end--> 
            <div class="top-menu">
            	<ul class="nav pull-right top-menu">
                    <li><a class="logout" href="lock_screen.html">Exit</a></li>
            	</ul>
            </div>
        </header>
      <!--header end-->
      
      <!-- **********************************************************************************************************************************************************
      MAIN SIDEBAR MENU
      *********************************************************************************************************************************************************** -->
      <!--sidebar start-->
      <aside>
          <div id="sidebar"  class="nav-collapse ">
              <!-- sidebar menu start-->
              <ul class="sidebar-menu" id="nav-accordion">

                  <li class="menu">
                      <a class="active" href="index.php" >
                          <i class="fa fa-desktop"></i>
                          <span>Dashboard</span>
                      </a>
                  </li>
                  <li class="sub-menu">
                      <a href="javascript:;" >
                          <i class=" fa fa-bar-chart-o"></i>
                          <span>Charts</span>
                      </a>
                      <ul class="sub">
                          <li><a  href="blank.php">Blank Page</a></li>
                          <li><a  href="chartjs.html">Chartjs</a></li>
                      </ul>
                  </li>

              </ul>
              <!-- sidebar menu end-->
          </div>
      </aside>
      <!--sidebar end-->
      
      <!-- **********************************************************************************************************************************************************
      MAIN CONTENT
      *********************************************************************************************************************************************************** -->
      <!--main content start-->
      <!--Responsive Table-->
      <section id="main-content">
          <section class="wrapper">
            <div class="row mt">
                <div class="col-lg-12">
                    <div class="content-panel">
                    <h4><i class="fa fa-angle-right"></i>Recently Logged</h4>
                        <hr>
                        <section id="unseen">
                        <table class="table table-bordered table-striped table-advanced">
                            <thead>
                            <tr>
                                <th>Item</th>
                                <th class="numeric">Quantity</th>
                                <th class="numeric">Calories</th>
                                <th>Time Logged</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>   
                            <?php
                                // Scan table and loop through rows to add to table
                                $response = $dynamodb->scan([
                                    'TableName' => $tableName
                                ]);
                                
                                foreach ($response['Items'] as $key => $value) {
                                    echo "\n";
                                    echo '<tr>';
                                    foreach ($value['Items']['M'] as $iKey => $iValue) {                                
                                        echo '    <td>' . $iKey . '</td>';
                                        echo '    <td class="numeric">' . $iValue['N'] . '</td>';
                                    }
                                    echo '    <td class="numeric">' . $value['Calories']['N'] . '</td>';
                                    echo '    <td>' . $value['TimeOfLog']['S'] . '</td>';
                                    echo '<td>
                                            <button class="btn btn-primary btn-xs"><i class="fa fa-pencil"></i></button>
                                            <button class="btn btn-danger btn-xs"><i class="fa fa-trash-o "></i></button>
                                          </td>';
                                    echo '</tr>';
                                }
                            ?>  
                            </tbody>
                        </table>
                        </section>
                    </div><!-- /content-panel -->
                </div><!-- /col-lg-4 -->			
            </div><!-- /row -->            

            <div class="row mt">
      			<div class="col-lg-6 col-md-6 col-sm-12">
      				<! -- BASIC PROGRESS BARS -->
      				<div class="showback">
      					<h4><i class="fa fa-angle-right"></i>Quick Goals</h4>
	      				<div class="progress">
						  <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 40%">
						    <span class="sr-only">40% Complete (success)</span>
						  </div>
						</div>
						<div class="progress">
						  <div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 20%">
						    <span class="sr-only">20% Complete</span>
						  </div>
						</div>
						<div class="progress">
						  <div class="progress-bar progress-bar-warning" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%">
						    <span class="sr-only">60% Complete (warning)</span>
						  </div>
						</div>
						<div class="progress">
						  <div class="progress-bar progress-bar-danger" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" style="width: 80%">
						    <span class="sr-only">80% Complete</span>
						  </div>
						</div>
      				</div><!--/showback -->
      			</div>
            </div>
		</section><! --/wrapper -->
      </section><!-- /MAIN CONTENT -->
                  

      <!--main content end-->
  </section>
      <!--footer start-->
      <footer class="site-footer">
          <div class="text-center">
              Made @ TreeHacks 2017
              <a href="index.php#" class="go-top">
                  <i class="fa fa-angle-up"></i>
              </a>
            </div>
      </footer>
      <!--footer end-->

    <!-- js placed at the end of the document so the pages load faster -->
    <script src="assets/js/jquery.js"></script>
    <script src="assets/js/jquery-1.8.3.min.js"></script>
    <script src="assets/js/bootstrap.min.js"></script>
    <script class="include" type="text/javascript" src="assets/js/jquery.dcjqaccordion.2.7.js"></script>
    <script src="assets/js/jquery.scrollTo.min.js"></script>
    <script src="assets/js/jquery.nicescroll.js" type="text/javascript"></script>
    <script src="assets/js/jquery.sparkline.js"></script>


    <!--common script for all pages-->
    <script src="assets/js/common-scripts.js"></script>
    
    <script type="text/javascript" src="assets/js/gritter/js/jquery.gritter.js"></script>
    <script type="text/javascript" src="assets/js/gritter-conf.js"></script>

    <!--script for this page-->
    <script src="assets/js/sparkline-chart.js"></script>    
	<script src="assets/js/zabuto_calendar.js"></script>	
	
	<script type="application/javascript">
        $(document).ready(function () {
            $("#date-popover").popover({html: true, trigger: "manual"});
            $("#date-popover").hide();
            $("#date-popover").click(function (e) {
                $(this).hide();
            });
        
            $("#my-calendar").zabuto_calendar({
                action: function () {
                    return myDateFunction(this.id, false);
                },
                action_nav: function () {
                    return myNavFunction(this.id);
                },
                ajax: {
                    url: "show_data.php?action=1",
                    modal: true
                },
                legend: [
                    {type: "text", label: "Special event", badge: "00"},
                    {type: "block", label: "Regular event", }
                ]
            });
        });
        
        
        function myNavFunction(id) {
            $("#date-popover").hide();
            var nav = $("#" + id).data("navigation");
            var to = $("#" + id).data("to");
            console.log('nav ' + nav + ' to: ' + to.month + '/' + to.year);
        }
    </script>
  
    <!-- AWS -->
    <script>
        var foodItems = [];
        
        AWS.config.update({
            region: "us-east-1",
            endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
            // accessKeyId default can be used while using the downloadable version of DynamoDB. 
            // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
            accessKeyId: "AKIAJKTVMITXX54WN63A",
            // secretAccessKey default can be used while using the downloadable version of DynamoDB. 
            // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
            secretAccessKey: "JYmy09GkAXHBzQj9yub+XGRigSIpbTZ4LZtRTFu0"
        });

        var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

        function readItem() {
            var table = 'LoggedItems';
            var logTime = "myTimeStamp";

            var itemParams = {
                TableName: table,
                Key: {
                    TimeOfLog: logTime
                }
            };
            docClient.get(itemParams, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Added new item', data);
                }
            });
        }

        // Get all the timestamps and order it
        var db = new AWS.DynamoDB.DocumentClient();
        db.scan({
            TableName: 'LoggedItems',
            
        }, (err, data) => {
            if(err) console.error(err);
            else {
                foodItems = data.Items;
                console.log('Scan success. Data: ', foodItems);
            }
        });

        var db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        db.listTables(function(err, data) { 
            console.log(data.TableNames);
        });
    </script>

  </body>
</html>
