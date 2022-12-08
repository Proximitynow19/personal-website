var socket = io();

moment.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds",
    ss: "%d seconds",
    m: "a minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    w: "a week",
    ww: "%d weeks",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years",
  },
});

socket.on("app.initiate", (data) => {
  parseActivity(data.presence);

  data.projects.forEach((project) => {
    $("#project-container").html(
      `${$("#project-container").html()} <a href="${
        project.url
      }" target="_blank"><div class="project"><h1>${project.name}</h1><p>${
        project.description || "​"
      }</p><span>Last update ${moment(
        project.pushed_at
      ).fromNow()}.</span></div></a>`
    );
  });
});

socket.on("presence.update", (data) => {
  parseActivity(data);
});

async function parseActivity(a) {
  let data = a;

  let activities = data.activities.slice().filter((k) => k.type != 4);
  let status = data.activities.find((k) => k.type == 4);

  const types = {
    5: "competing in ",
    3: "watching ",
    2: "listening to ",
    1: "streaming ",
    0: "playing ",
  };

  if (status && status.state) {
    $("#activities").html(status.state);
  } else {
    $("#activities").html(
      data.status.charAt(0).toUpperCase() + data.status.slice(1)
    );
  }

  if (activities.length > 0) {
    $("#activities").html(`${$("#activities").html()} ● `);
  }

  for (let i = 0; i < activities.length; i++) {
    let string = "";

    if (i > 0 && i < activities.length - 1) {
      string += ", ";
    } else if (i > 0) {
      string += " and ";
    }

    if ([5, 3, 2, 1, 0].includes(activities[i].type))
      string += types[activities[i].type];

    if (i == 0) string = string.charAt(0).toUpperCase() + string.slice(1);

    $("#activities").html(`${$("#activities").html()}${string}`);

    string = "";

    if ([3, 0, 2, 5].includes(activities[i].type)) {
      string += activities[i].name;
    } else {
      string += activities[i].details;
    }

    $("#activities").html(
      `${$(
        "#activities"
      ).html()}<span class='activity' data-activity='${i}'>${string}</span>`
    );
  }

  $("#activities").html(`${$("#activities").html()}.`);

  $(".activity").hover(
    function () {
      $("#tooltip").css("display", "block");
      let data = activities[$(this).data("activity")];

      $("#aBox").addClass("no-image");

      if (data.assets && data.assets.large) {
        $("#aLarge").css("display", "block");

        $("#aLarge").attr("src", data.assets.large);

        $("#aBox").removeClass("no-image");
      } else {
        $("#aLarge").css("display", "none");
      }

      if (data.assets && data.assets.small) {
        $("#aSmall").css("display", "block");

        $("#aSmall").attr("src", data.assets.small);

        $("#aBox").removeClass("no-image");
      } else {
        $("#aSmall").css("display", "none");
      }

      $("#aName").text(`${types[data.type]}${data.name}`.toUpperCase());

      $("#aDetails").text(data.details || "​");

      $("#aState").text(data.state || "​");
    },
    () => {
      $("#tooltip").css("display", "none");
    }
  );
}

(function () {
  document.onmousemove = handleMouseMove;
  function handleMouseMove(event) {
    var eventDoc, doc, body;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
      eventDoc = (event.target && event.target.ownerDocument) || document;
      doc = eventDoc.documentElement;
      body = eventDoc.body;

      event.pageX =
        event.clientX +
        ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
        ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
      event.pageY =
        event.clientY +
        ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
        ((doc && doc.clientTop) || (body && body.clientTop) || 0);
    }

    // Use event.pageX / event.pageY here
    let tooltip = document.getElementById("tooltip");
    if (!tooltip) return;
    let left = event.pageX;
    let top = event.pageY;
    let offset = screen.width * 0.0098;
    tooltip.style.left = left + offset + "px";
    tooltip.style.top = top + offset + "px";
  }
})();
