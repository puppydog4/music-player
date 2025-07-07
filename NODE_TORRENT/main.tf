resource "aws_instance" "ec2_basics" {
  ami                  = data.aws_ami.amazon_linux_ami.id
  instance_type        = "t2.micro"
  availability_zone    = "eu-west-2a"
  security_groups      = [aws_security_group.ec2_basics.name]
  iam_instance_profile = aws_iam_instance_profile.instance_profile.name

  key_name = "ec2-key"
  tags = {
    Name : "EC2 Basics"
  }
  user_data                   = file("./script.sh")
  user_data_replace_on_change = true
}
