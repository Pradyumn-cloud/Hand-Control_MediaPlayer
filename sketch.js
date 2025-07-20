 const video = document.getElementById("videoPlayer");
let count =0
function playVideo() {
  
  video.play();
    
  
}

function pauseVideo()
{
  video.pause();
}


function rewind() {
  video.currentTime -= 10;
}

function forward() {
  video.currentTime += 10;
}

function setVolume(value) {
  video.volume = value;
}

function loadVideo() {
  const url = document.getElementById("videoURL").value;
  if (!url || (!url.endsWith(".mp4") && !url.endsWith(".webm"))) {
    alert("Please enter a valid direct video URL (.mp4 or .webm)");
    return;
  }
  video.src = url;
  video.load();
  video.play();
}

let handPose;
let vv;
let hands = [];
let connections;

function preload() {
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  vv = createCapture(VIDEO);
  vv.size(640, 480);
  vv.hide();
  handPose.detectStart(vv, gotHands);
  connections = handPose.getConnections();
}

function draw() {
  // Draw the webcam video
  image(vv, 0, 0, width, height);

  
  // Draw the skeletal connections
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < connections.length; j++) {
      let pointAIndex = connections[j][0];
      let pointBIndex = connections[j][1];
      let pointA = hand.keypoints[pointAIndex];
      let pointB = hand.keypoints[pointBIndex];
      stroke(255, 0, 0);
      strokeWeight(2);
      line(pointA.x, pointA.y, pointB.x, pointB.y);
    }
  }

  // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
    }
  }
}


function gotHands(results) {

    function isOpenPalm(hand) 
    {
      if (!hand || !hand.wrist) return false;

      const wrist = hand.wrist;

      // Tip positions of fingers
      const tips = [
        hand.index_finger_tip,
        hand.middle_finger_tip,
        hand.ring_finger_tip,
        hand.pinky_finger_tip,
        hand.thumb_tip
      ];

      let extendedCount = 0;

      for (let tip of tips) {
        if (!tip) continue;

        const dx = tip.x - wrist.x;
        const dy = tip.y - wrist.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If distance from wrist is big enough, consider the finger extended
        if (distance > 80) { // Threshold may need tuning
          extendedCount++;
        }
      }

      // If 4 or more fingers are extended, consider it an open palm
      return extendedCount >= 4;
    }



  if ( !isOpenPalm(results[0])) {
    playVideo();
  }

  if (results[0] && isOpenPalm(results[0])) {
    pauseVideo();
  }
  


function isClosedPalm(hand) 
{
  if (!hand || !hand.wrist) return false;

  // Check each finger by comparing tip position to intermediate joints
  const fingers = [
    {
      tip: hand.index_finger_tip,
      pip: hand.index_finger_pip,  // proximal interphalangeal joint
      dip: hand.index_finger_dip   // distal interphalangeal joint
    },
    {
      tip: hand.middle_finger_tip,
      pip: hand.middle_finger_pip,
      dip: hand.middle_finger_dip
    },
    {
      tip: hand.ring_finger_tip,
      pip: hand.ring_finger_pip,
      dip: hand.ring_finger_dip
    },
    {
      tip: hand.pinky_finger_tip,
      pip: hand.pinky_finger_pip,
      dip: hand.pinky_finger_dip
    }
  ];

  let closedCount = 0;

  // Check 4 main fingers (excluding thumb for now)
  for (let finger of fingers) {
    if (!finger.tip || !finger.pip || !finger.dip) continue;

    // Check if tip is "behind" the pip joint (finger is curled)
    // This works better than distance-based checking
    const tipToPip = Math.sqrt(
      Math.pow(finger.tip.x - finger.pip.x, 2) + 
      Math.pow(finger.tip.y - finger.pip.y, 2)
    );

    const dipToPip = Math.sqrt(
      Math.pow(finger.dip.x - finger.pip.x, 2) + 
      Math.pow(finger.dip.y - finger.pip.y, 2)
    );

    // If tip is closer to pip than dip is, finger is likely curled
    if (tipToPip < dipToPip * 1.2) {
      closedCount++;
    }
  }

  // Check thumb separately (different joint structure)
  if (hand.thumb_tip && hand.thumb_ip && hand.thumb_mcp) {
    const thumbTipToMcp = Math.sqrt(
      Math.pow(hand.thumb_tip.x - hand.thumb_mcp.x, 2) + 
      Math.pow(hand.thumb_tip.y - hand.thumb_mcp.y, 2)
    );

    const thumbIpToMcp = Math.sqrt(
      Math.pow(hand.thumb_ip.x - hand.thumb_mcp.x, 2) + 
      Math.pow(hand.thumb_ip.y - hand.thumb_mcp.y, 2)
    );

    // If thumb tip is close to the palm, thumb is closed
    if (thumbTipToMcp < thumbIpToMcp * 1.3) {
      closedCount++;
    }
  }

  // If 4 or more fingers are closed, consider it a closed palm
  return closedCount >= 4;
}


  console.log(isClosedPalm(results[0]));

  if (results[0] && isClosedPalm(results[0])) {
    forward();
  }


  let soundLevel = Math.abs(results[0]?.index_finger_tip.x - results[0]?.thumb_tip.x)

  if(soundLevel <= 50 && soundLevel!=NaN && !isOpenPalm(results[0]))
  {
    let volume = soundLevel / 50;
    
    setVolume(volume);
    
  }
  
  hands = results;


}