Commits:
1. EC2 and volume creation.
2. Security groups.
3. Deploying the application with NGINX.
4. File refactor.


# EC2 and Volume creation
Volume is the hard disk to the server. It must be created alongside the server.

# Security groups

After creating the EC2 instance, volume and security group, I wanted to try and test if the security group worked.

I used these two commands:
- `ping <ec2 public ip>` => `ping 3.107.229.254`. This returned 
```sh
Request timeout for icmp_seq 1
Request timeout for icmp_seq 2
Request timeout for icmp_seq 3
...
```
which suggests that the security has blocked the request.
- `nc -zv <ec2 ip> <port>` => `nc -zv 3.107.229.254 443`. I chose port 443 as I knew it was allowed by the security group. However, this returned `Connection refused`, which suggests I was able to connect to the server, but no connection was made. This is likely due to the fact that there is no application listening on port 443—there is nothing to connect with.
- curl https://3.26.1.242
curl: (7) Failed to connect to 3.26.1.242 port 443 after 317 ms: Couldn't connect to server

So, the next step is to deploy the application on server start up and route traffic from port `443` to the port that the application is listening on!

### Tags refactor

# Deploying the application

To deploy the application, at minimum, I need to ensure a few things:
- The application code is on the server and can be run (I will need to `git clone` the code into the server).
- The server has the necessary dependencies to run the application code (node and npm).
- The server has the necessary dependencies to get the application code (git).

So, I used the SSH protocol to access the server via my terminal and try running each command of my server start up script. 

After it was running locally, I used `curl http://localhost:3001` to test. I received `Socket.IO server is running!`

Some issues I encountered when developing the script:
- Script running in `/` rather than `~`, which is where you are when you ssh into the instance. I was confused because the app folder could not be found but this was also because if i SSHed into the server too early, the script may not have finished running.
- `sudo less /var/log/cloud-init-output.log`
- pm2 being installed and running but could not be found when I sshed in because i was not sudo.

# NGINX Forwarding
Forward traffic to the instance to the application port.

### Files refactor

```

# Configures pm2 to automatically start when the server reboots.

# Saves the current pm2 running application state for future server reboots so it knows what to restart on server startup.





```

# General infrastructure

### VPC
A VPC is a container of IPs that contains resources.
A VPC is separated into a number of subnets.
- Subnets are private or public not from a property of the subnet itself but whether it is connected to an internet gateway or not

### Route table
A route table is responsible for specifying traffic to and from the subnet. It does so by defining the IP ranges your subnet can communicate with and which gateways or interfaces to use to reach those networks. 

Without it, no resource in the subnet would be able to send data to any other resource. Concretely,
- Inbound requests: Packets would be dropped as the resource's subnet can't be found.
- Outbound requests: Packets can't leave the subnet as they don't know where to go.
- Internal requests: Also fails.

Route tables are automatically created with local routes that allow inter VPC communication so you do not need to specify this in your route table terraform code:
```tf
# This is automatic, you don't need to define it
route {
  cidr_block = "10.0.0.0/16"  # Your VPC CIDR
  local      = true
}
```


Internet -> incoming request -> internet gateway -> route look up -> route table -> matching route found (else traffic packets dropped) -> NACL check at the subnet level -> Allow (else traffic blocked) -> Security group check at the EC2 instance level -> Allow (else traffic blocked) -> EC2 instance



map_public_ip_on_launch = true in a subnet:

This setting automatically assigns a public IPv4 address to any EC2 instance launched in this subnet
Without this, instances would only get private IPs by default, even in a public subnet
This saves you from manually assigning public IPs to each instance


### Internet Gateway
An internet gateway has no configurable settings aside from tags and the vpc it is attached to.

When a packet leaves a VPC instance for the internet,
1. The source IP is the instance private IP.
2. When the packet first leaves the instance, it uses its private IP as the source IP
3. The Internet Gateway performs source NAT (SNAT), changing the source from private to public IP

I was correct about NAT happening, but I needed to explain WHY:

EC2 instances are not aware of their public IPs - these are only mapped at the Internet Gateway level
This is by design to maintain network isolation - instances operate purely with private IPs within the VPC
Even if you query an instance's metadata, the public IP is recorded as being associated with the instance, but isn't actually configured on the instance's network interface

This design means:

Inside the VPC: Everything works with private IPs
At the Internet Gateway: NAT translates between private and public IPs
On the Internet: Traffic uses public IPs

Scenario setup:

EC2 instance has Private IP: 10.0.1.10
EC2 instance has Public IP: 54.12.34.56
The instance wants to make a request to api.example.com (203.0.113.10)

Outbound request flow:

Instance sends packet:

Source IP: 10.0.1.10 (private)
Destination IP: 203.0.113.10 (api.example.com)


Internet Gateway performs SNAT:

Changes source IP: 10.0.1.10 → 54.12.34.56
Destination remains: 203.0.113.10



Return traffic flow:

api.example.com sends response:

Source IP: 203.0.113.10
Destination IP: 54.12.34.56


Internet Gateway translates:

Changes destination IP: 54.12.34.56 → 10.0.1.10
Source remains: 203.0.113.10



The Internet Gateway maintains this mapping:
54.12.34.56 ↔ 10.0.1.10