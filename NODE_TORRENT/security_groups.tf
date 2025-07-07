resource "aws_security_group" "ec2_basics" {
  name        = "ec2_basics"
  description = "Allows ssh and http to ec2"

  tags = {
    Name = "ec2_basics"
  }
}

resource "aws_security_group_rule" "allow_ssh" {
  security_group_id = aws_security_group.ec2_basics.id
  type              = "ingress"
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # in production it should be allowing only few authorized IPs (example -- coming from corporation network)
  from_port         = 22
  to_port           = 22
}

resource "aws_security_group_rule" "allow_http" {
  security_group_id = aws_security_group.ec2_basics.id
  type              = "ingress"
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 8081
  to_port           = 8081
}

resource "aws_security_group_rule" "allow_outbound" { # should be enabled by default
  security_group_id = aws_security_group.ec2_basics.id
  type              = "egress"
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 0
  to_port           = 0
}



