async function getYoutubeChannel(channelId, id) {
  console.log("Loading Youtube...");
  const youtubeRss = "https://web-production-ba07.up.railway.app/https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId;
  const youtubeFeed = document.getElementById("feed-youtube-" + id);

  await fetch(youtubeRss, {
    headers: {
      "Access-Control-Allow-Origin": youtubeRss,
      "Access-Control-Allow-Headers": "content-type",
    },
  })
    .then((response) => response.text())
    .then((str) => new window.DOMParser().parseFromString(str, "text/xml"))
    .then((data) => {
      const entries = data.querySelectorAll("entry");
      youtubeFeed.innerHTML = "";
      let entry = "";
      if (entries.length <= 0) {
        console.log("not ok");
        entry += `
        <div class="alert alert-warning d-flex align-items-center border-0 rounded-0 p-2" role="alert">
          <img class="me-2" src="./img/warning-diamond.svg" width="20" height="20" />
          <div>
            This Youtube channel doesn't seem to exist.
          </div>
        </div>
              `;
        youtubeFeed.innerHTML = entry;
      }

      entries.forEach((el) => {
        let title = el.querySelector("title").innerHTML;
        let author = el.querySelector("name").textContent;
        let videoId = el.querySelector("videoId").textContent;
        let embedLink = "https://www.youtube.com/embed/" + videoId;
        let published = convertTime(el.querySelector("published").textContent);
        let views = el.querySelector("statistics").getAttribute("views");
        let likes = el.querySelector("starRating").getAttribute("count");
        let preview = el.querySelector("thumbnail").getAttribute("url");

        entry += `
            <div class="list-group-item list-group-item-action" target="_blank">      
              <div class="ratio ratio-16x9">
                <iframe class="rounded-3" src="${embedLink}" title="YouTube video" allowfullscreen></iframe>
              </div>
              <p class="fw-semibold mb-2">${title}</p>
              <div class="d-flex flex-row">
              <p class="text-secondary small me-3"><img src="./img/clock.svg" width="14" /> ${published}</p>
              <p class="text-secondary small me-3"><img src="./img/eye.svg" width="14" /> ${views}</p>
              <p class="text-secondary small me-3"><img src="./img/thumbs-up.svg" width="14" /> ${likes}</p>
              </div>
            </div>
              `;
      });
      youtubeFeed.innerHTML = entry;
    });
}

// Add new youtube channel
const addNewYoutubeBtn = document.getElementById("addNewYoutube");
const newYoutubeName = document.getElementById("newYoutubeName");

newYoutubeName.addEventListener("input", function () {
  checkInputFill(newYoutubeName, addNewYoutubeBtn);
});

addNewYoutubeBtn.addEventListener("click", async function () {
  closeModal("newFeedModal");
  addNewYoutubeBtn.disabled = true;

  const channelName = await getChannelName(newYoutubeName.value);

  const { data, error } = await client
    .from("feeds")
    .insert([{ feed_name: channelName, feed_type: "youtube", feed_options: newYoutubeName.value, user_id: user_id }])
    .select();

  if (data) {
    showToast(channelName + " added to your feed");
    const feedContainer = document.getElementById("feedContainer");
    const sidebarContainer = document.getElementById("feedLogoContainer");
    let feed = "";
    let sidebar = "";

    sidebar += `
         <a id="sidebarLogo-${data[0].id}" href="#${data[0].id}" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="${data[0].feed_name}">
         <img class="rounded-3 m-2" src="./img/logo-youtube.svg" alt="" width="40" height="40" />
         </a>
        `;

    feed += `
        <div id="${data[0].id}" class="feed border-end">
          <div class="feed-header d-flex flex-row justify-content-between bg-body-tertiary border-bottom">
            <div class="d-flex align-items-center">
              <img class="me-2" src="./img/logo-youtube.svg" width="20" height="20" alt="" />
              <p id="youtubeChannelName">${data[0].feed_name}</p>
            </div>
            <div class="btn-group">
              <button type="button" class="btn bg-body-tertiary btn-sm p-0 rounded-1 border-0" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="./img/dots-three-vertical.svg" width="24" height="24" alt="" />
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li onclick="getYoutubeChannel('${data[0].feed_options}', ${data[0].id})"><button class="dropdown-item" type="button">Reload</button></li>
                <li onclick="removeYoutubeChannel(${data[0].id})"><button class="dropdown-item" type="button">Remove</button></li>
              </ul>
            </div>
          </div>
          <div id="feed-youtube-${data[0].id}" class="list-group list-group-flush feed-body">
            <div class="p-2 placeholder-glow">
              <span class="placeholder placeholder-lg col-6 bg-secondary"></span>
              <span class="placeholder col-7 bg-secondary"></span>
              <span class="placeholder col-4 bg-secondary"></span>
              <span class="placeholder placeholder-sm col-2 bg-secondary"></span>
            </div>
          </div>
        </div>
        `;
    hideEmpty();
    feedContainer.innerHTML += feed;
    sidebarContainer.innerHTML += sidebar;
    scrollToPos(data[0].id);
    getYoutubeChannel(data[0].feed_options, data[0].id);
  }

  newYoutubeName.value = "";

  if (error) {
    console.log(error);
  }
  initTooltip();
});

// Remove youtube channel
async function removeYoutubeChannel(id) {
  const { error } = await client.from("feeds").delete().eq("id", id);
  if (error) {
    console.log(error);
  } else {
    console.log("Deleted");
    showToast("Feed deleted");
    let feedContainer = document.getElementById(id);
    let sidebarLogo = document.getElementById("sidebarLogo-" + id);
    feedContainer.remove();
    sidebarLogo.remove();
  }
}

// Get channel name from id
async function getChannelName(channelId) {
  console.log("Getting channel name...");
  const youtubeRss = "https://web-production-ba07.up.railway.app/https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId;

  try {
    const response = await fetch(youtubeRss, {
      headers: {
        "Access-Control-Allow-Origin": youtubeRss,
        "Access-Control-Allow-Headers": "content-type",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const text = await response.text();
    const data = new window.DOMParser().parseFromString(text, "text/xml");
    const title = data.querySelector("title").textContent;

    if (title) {
      return title;
    } else {
      throw new Error("Title not found");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    throw error; // Re-throw the error so it can be caught by the caller
  }
}
