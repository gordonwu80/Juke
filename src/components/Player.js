// tutorials used: 
// https://levelup.gitconnected.com/how-to-build-a-spotify-player-with-react-in-15-minutes-7e01991bc4b6
// https://medium.com/@jonnykalambay/now-playing-using-spotifys-awesome-api-with-react-7db8173a7b13
// https://mbell.me/blog/2017-12-29-react-spotify-playback-api/

import React, { Component } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "../constants/Config";
import { Button, Grid, Icon, Segment } from 'semantic-ui-react'
import hash from "../actions/Hash";
import "../css/player.css";
import "../css/index.css";
import Playlist from './Playlist';
import Tabs from './Tabs';


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default class Player extends Component {
  constructor() {
    super();
    this.state = {
      token: null,
      item: {
        album: {
          images: [{ url: "" }]
        },
        name: "",
        artists: [{ name: "" }],
        duration_ms: 0,
      },
      is_playing: false,
      progress_ms: 0,
      loggedIn: false,
      deviceId: "",
      error: "",
      position: 0,
      duration: 1,
    };
  }

  componentDidMount() {
    const { mediaActions } = this.props

    // Get token
    let _token = hash.access_token;

    if (_token) {
      // Set token
      this.setState({
        token: _token,
        loggedIn: true,
      });

      mediaActions.saveToken(_token);
      this.createPlayer(_token);
    }
  }

  getToken = () => {
    return this.state.token;
  }

  async createPlayer(_token) {
    
    // wait for the Spotify SDK to load
    while (!window.Spotify) {
      await sleep(30)
    }

    // create a new player
    this.player = new window.Spotify.Player({
      name: "Juke",
      getOAuthToken: cb => { cb(_token); },
    });
    // set up the player's event handlers
    this.createEventHandlers();

    // finally, connect
    this.player.connect();
  }

  createEventHandlers = () => {
    // problem setting up the player
    this.player.on('initialization_error', e => { console.error(e); });
    // problem authenticating the user.
    // token was invalid 
    this.player.on('authentication_error', e => {
      console.error(e);
      this.setState({ loggedIn: false });
    });
    // currently only premium accounts can use the API
    this.player.on('account_error', e => { console.error(e); });
    // loading/playing the track failed for some reason
    this.player.on('playback_error', e => { console.error(e); });
    // Playback status updates
    this.player.on('player_state_changed', state => this.onStateChanged(state));

    // Ready
    this.player.on('ready', async data => {
      let { device_id } = data;
      // set the deviceId variable, then try
      // to swap music playback to Juke
      await this.setState({ deviceId: device_id });
      this.transferPlaybackHere(device_id);
    });
  }

  transferPlaybackHere = (deviceId) => {
    // https://beta.developer.spotify.com/documentation/web-api/reference/player/transfer-a-users-playback/
    fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${this.state.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "device_ids": [deviceId],
        // true: start playing music if it was paused on the other device
        // false: paused if paused on other device, start playing music otherwise
        "play": false,
      }),
    });
  }

  // when we receive a new update from the player
  onStateChanged = (state) => {
    // only update if we got a real state
    if (state !== null) {
      const {
        current_track: currentTrack,
        position,
        duration,
      } = state.track_window;
      const is_playing = !state.paused;

      this.setState({
        position,
        duration,
        item: currentTrack,
        is_playing
      });
    } else {
      // state was null, user might have swapped to another device
      this.setState({ error: "Looks like you might have swapped to another device?" });
    }
  }

  onPrevClick = () => {
    this.player.previousTrack();
  }

  onPlayClick = () => {
    this.player.togglePlay();
  }

  onNextClick = () => {
    this.player.nextTrack();
  }

  render() {
    const { is_playing } = this.state;

    return (
      <Segment id="player" inverted padded={false}>
        {/* Get token */}
        {!this.state.token && (
          <Button 
            fluid
            style={{
              margin: "auto",
              width:"50%"
            }}
            color="green"
            inverted
            href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
              "%20"
            )}&response_type=token&show_dialog=true`}>
            Login to Spotify
          </Button>
        )}
        {/* Display player once token acquired */}
        {this.state.token && (
          <Grid >
            <Grid.Row verticalAlign='middle'>
              <Grid.Column width={4}>
                <img height="100" src={this.state.item.album.images[0].url} /><br />
                {/* {this.state.item.album.name} */}
              </Grid.Column>
              <Grid.Column width={12}>
                {`${this.state.item.name} - ${this.state.item.artists[0].name}`}<br />
                <Button.Group id="player-controls" icon>
                  <Button
                    inverted
                    basic
                    onClick={() => this.onPrevClick()} >
                    <Icon name='fast backward' />
                  </Button>
                  {
                    is_playing
                      ? <Button
                        inverted
                        basic
                        onClick={() => this.onPlayClick()}>
                        <Icon name='pause' />
                      </Button>
                      : <Button
                        inverted
                        basic
                        onClick={() => this.onPlayClick()}>
                        <Icon name='play' />
                      </Button>
                  }
                  <Button
                    inverted
                    basic
                    onClick={() => this.onNextClick()} >
                    <Icon name='fast forward' />
                  </Button>
                </Button.Group>
              </Grid.Column>
              <Grid.Column width={16} textAlign='left'>
                <Tabs {...this.props} />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        )
        }
      </Segment>

    );
  }
}