'use strict';
/*
 * Copyright Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// a routed message handler deals with all messages within a particular channel scope

// it is responsible for massaging messages and flushing batches of data messages.

function getRoutedMessageHandler(params, onMessage, onError, isRetryPatchMode) {
  var expectedBatchMessageCount = 0;
  var numBatchesDetermined = false;
  var messageBatchBuffer = [];
  var lastSeenDataTime = 0;
  var lastSeenDataBatchTime = 0;

  function composeDataBatches(dataArray) {
    if (dataArray.length === 0) {
      if (messageBatchBuffer.length > 0) {
        console.error('Composed an empty data batch despite having data in the buffer!');
      }
      return null;
    }

    var errorOccurred = false;
    var basisData = dataArray[0];
    var expectedTimeStamp = basisData.logicalTimestampMs;
    lastSeenDataBatchTime = expectedTimeStamp;
    dataArray.slice(1).forEach(function (batch) {
      if (batch.logicalTimestampMs !== expectedTimeStamp) {
        errorOccurred = true;
      } else {
        basisData.data = basisData.data.concat(batch.data);
      }
    });

    if (errorOccurred) {
      console.error('Bad timestamp pairs when flushing data batches!  Inconsistent data!');
      return null;
    }
    return basisData;
  }

  function flushBuffer() {
    if (numBatchesDetermined && messageBatchBuffer.length === expectedBatchMessageCount && messageBatchBuffer.length > 0) {
      onMessage(composeDataBatches(messageBatchBuffer));
      messageBatchBuffer = [];
    }
  }

  return {
    getLatestBatchTimeStamp: function () {
      return lastSeenDataBatchTime;
    },
    // only for unit tests
    _getBufferSize: function () {
      return messageBatchBuffer.length;
    },
    onMessage: function messageReceived(msg) {
      if (!msg.type && msg.hasOwnProperty('error')) {
        onMessage(msg);
        return;
      }
      switch (msg.type) {
        case 'data':
          if (lastSeenDataTime && lastSeenDataTime !== msg.logicalTimestampMs) {
            // if zero time series are encountered, then no metadata arrives, but data batches arrive with differing
            // timestamp as the only evidence of a stream block
            numBatchesDetermined = true;
            flushBuffer();
          }
          lastSeenDataTime = msg.logicalTimestampMs;
          messageBatchBuffer.push(msg);
          if (!numBatchesDetermined) {
            expectedBatchMessageCount++;
          } else if (messageBatchBuffer.length === expectedBatchMessageCount) {
            flushBuffer();
          }
          break;
        case 'message':
          if (msg.message && msg.message.messageCode === 'JOB_RUNNING_RESOLUTION') {
            numBatchesDetermined = true;
            flushBuffer();
          }
          onMessage(msg);
          break;
        case 'metadata':
        case 'event':
          onMessage(msg);
          break;
        case 'control-message':
          if (isRetryPatchMode && !numBatchesDetermined) {
            break;
          }
          onMessage(msg);
          break;
        case 'error':
          if (onError) {
            onError(msg);
          }
          break;
        default:
          console.log('Unrecognized message type.');
          break;
      }
      flushBuffer();
    }
  };
}

module.exports = getRoutedMessageHandler;
